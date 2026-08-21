'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { fetchApi } from '@/lib/api';
import { Toast } from '@/components/ui/Toast';
import { Plus } from '@/components/ui/Icon';

export default function EmployeeLeavePage() {
  const [balances, setBalances] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Leave application modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveTypeId, setLeaveTypeId] = useState('');
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
        fetchApi('/leave/requests').catch(() => ({ leave_requests: [] })),
        fetchApi('/leave/types').catch(() => ({ leave_types: [] })),
      ]);
      setBalances(balRes?.balances || []);
      setRequests(reqRes?.leave_requests || []);
      setLeaveTypes(typeRes?.leave_types || []);

      if (typeRes?.leave_types?.length > 0) {
        setLeaveTypeId(typeRes.leave_types[0].id.toString());
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

      {/* LEAVE BALANCE CARDS */}
      {balances.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              className="px-4 py-2 bg-[#0f365e] text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Submit First Application
            </button>
          </div>
        ) : (
          <TablePrimitive
            headers={['Leave Type', 'Duration', 'Days Requested', 'Reason', 'Status']}
            rows={requests.map((r) => [
              <span key="type" className="font-extrabold text-slate-900 text-xs">{r.leave_type?.name || 'Leave'}</span>,
              <span key="dates" className="font-mono text-xs text-slate-700">{r.start_date} to {r.end_date}</span>,
              <span key="days" className="font-bold text-slate-900 text-xs">{r.days_count} Days</span>,
              <span key="reason" className="text-xs text-slate-600 truncate max-w-xs block">{r.reason}</span>,
              <Badge key="status" variant={r.status === 'approved' ? 'green' : r.status === 'pending' ? 'yellow' : 'red'}>
                {r.status}
              </Badge>,
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
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
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
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#0f365e] text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50"
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
