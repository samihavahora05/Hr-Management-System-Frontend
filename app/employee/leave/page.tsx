'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { fetchApi } from '@/lib/api';
import { Toast } from '@/components/ui/Toast';
import { Plus, XCircle } from '@/components/ui/Icon';

const DEFAULT_LEAVE_TYPES = [
  { id: 1, name: 'Casual Leave (CL)', annual_quota: 12 },
  { id: 2, name: 'Sick Leave (SL)', annual_quota: 10 },
  { id: 3, name: 'Earned / Privilege Leave (PL)', annual_quota: 15 },
  { id: 4, name: 'Maternity / Paternity Leave', annual_quota: 30 },
  { id: 5, name: 'Compensatory Off (Comp-Off)', annual_quota: 5 },
  { id: 6, name: 'Unpaid Leave (LOP)', annual_quota: 0 },
];

export default function EmployeeLeavePage() {
  const [balances, setBalances] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>(DEFAULT_LEAVE_TYPES);
  const [loading, setLoading] = useState(true);

  // Leave application modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveTypeId, setLeaveTypeId] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [balRes, reqRes, typeRes] = await Promise.all([
        fetchApi('/leave/balances').catch(() => ({ balances: [] })),
        fetchApi('/leave/requests?view_mode=personal').catch(() => ({ leave_requests: [] })),
        fetchApi('/leave/types').catch(() => ({ leave_types: DEFAULT_LEAVE_TYPES })),
      ]);
      setBalances(balRes?.balances || []);
      setRequests(reqRes?.leave_requests || []);
      const fetchedTypes = typeRes?.leave_types?.length > 0 ? typeRes.leave_types : DEFAULT_LEAVE_TYPES;
      setLeaveTypes(fetchedTypes);

      if (fetchedTypes?.length > 0) {
        setLeaveTypeId(fetchedTypes[0].id.toString());
      }
    } catch (err) {
      setToastMessage('Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetchApi('/leave/requests', {
        method: 'POST',
        body: JSON.stringify({
          leave_type_id: leaveTypeId,
          start_date: startDate,
          end_date: endDate,
          reason,
        }),
      });

      setToastMessage('Leave application submitted for approval');
      setIsModalOpen(false);
      setReason('');
      setStartDate('');
      setEndDate('');
      await loadData();
    } catch (err: any) {
      setToastMessage(err.message || 'Leave application failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this pending leave request?')) {
      return;
    }
    try {
      await fetchApi(`/leave/requests/${id}/cancel`, { method: 'POST' });
      setToastMessage('Leave request cancelled successfully');
      await loadData();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to cancel leave request');
    }
  };

  return (
    <PortalLayout namespace="employee">
      <PageHeader
        title="My Statutory Leave Portal"
        description="Check remaining leave quotas, apply for annual leave, and track application status"
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        }
      />

      {/* LEAVE BALANCES GRID */}
      {balances.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {balances.map((b) => (
            <div key={b.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{b.leave_type?.name || 'Leave'}</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-[#0f365e]">{b.remaining}</span>
                <span className="text-xs font-semibold text-slate-500">/ {b.allocated} days remaining</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">{b.used} days used this period</p>
            </div>
          ))}
        </div>
      )}

      {/* LEAVE REQUESTS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium">
            Fetching your leave applications...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center rounded-xl">
            <p className="text-sm font-extrabold text-slate-800 mb-1">No Leave Applications Submitted</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Click &quot;Apply for Leave&quot; above to request time off from your manager.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#0f365e] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              Submit First Application
            </button>
          </div>
        ) : (
          <TablePrimitive
            headers={['Leave Type', 'Duration', 'Days', 'Reason', 'Status', 'Actions']}
            rows={requests.map((r) => [
              <span key="type" className="font-extrabold text-slate-900 text-xs">{r.leave_type?.name || 'Leave'}</span>,
              <span key="dates" className="font-mono text-xs text-slate-700">{r.start_date} to {r.end_date}</span>,
              <span key="days" className="font-bold text-slate-900 text-xs">{r.days_count}d</span>,
              <span key="reason" className="text-xs text-slate-600 truncate max-w-xs block">{r.reason}</span>,
              <Badge
                key="status"
                variant={r.status === 'approved' ? 'green' : r.status === 'pending' ? 'yellow' : r.status === 'cancelled' ? 'gray' : 'red'}
              >
                {r.status}
              </Badge>,
              <div key="action">
                {r.status === 'pending' ? (
                  <button
                    onClick={() => handleCancelRequest(r.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                    title="Cancel pending application"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400">—</span>
                )}
              </div>,
            ])}
          />
        )}
      </div>

      {/* APPLY LEAVE MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Submit Leave Request">
        <form onSubmit={handleApplyLeave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Leave Category</label>
            <select
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
            >
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (Quota: {t.annual_quota} days/yr)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Leave</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="State the reason for leave request..."
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#0f365e] text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
