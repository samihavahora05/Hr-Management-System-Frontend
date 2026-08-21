'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { fetchApi } from '@/lib/api';
import { Toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Plus, CheckCircle, XCircle, Clock } from '@/components/ui/Icon';

const DEFAULT_LEAVE_TYPES = [
  { id: 1, name: 'Casual Leave (CL)', annual_quota: 12 },
  { id: 2, name: 'Sick Leave (SL)', annual_quota: 10 },
  { id: 3, name: 'Earned / Privilege Leave (PL)', annual_quota: 15 },
  { id: 4, name: 'Maternity / Paternity Leave', annual_quota: 30 },
  { id: 5, name: 'Compensatory Off (Comp-Off)', annual_quota: 5 },
  { id: 6, name: 'Unpaid Leave (LOP)', annual_quota: 0 },
];

export default function ManagerLeavePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>(DEFAULT_LEAVE_TYPES);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Apply Leave Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveTypeId, setLeaveTypeId] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqRes, typesRes] = await Promise.all([
        fetchApi('/leave/requests'),
        fetchApi('/leave/types').catch(() => ({ leave_types: DEFAULT_LEAVE_TYPES })),
      ]);
      setRequests(reqRes.leave_requests || []);
      const fetchedTypes = typesRes.leave_types?.length > 0 ? typesRes.leave_types : DEFAULT_LEAVE_TYPES;
      setLeaveTypes(fetchedTypes);
      if (fetchedTypes?.length > 0) {
        setLeaveTypeId(fetchedTypes[0].id.toString());
      }
    } catch (err) {
      setToastMessage('Failed to load leave requests');
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

      setToastMessage('Leave request submitted successfully to Administrator for review.');
      setIsModalOpen(false);
      setReason('');
      setStartDate('');
      setEndDate('');
      await loadData();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PortalLayout namespace="manager">
      <PageHeader
        title="My Leave & Applications"
        description="Submit personal leave requests directly to the Administrator and track your approval status"
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

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium">
            Loading your leave applications...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">
            You have not submitted any leave requests yet. Click &quot;Apply for Leave&quot; above to request time off.
          </div>
        ) : (
          <TablePrimitive
            headers={['Leave Type', 'Duration', 'Days', 'Reason', 'Approval Status', 'Admin Decision']}
            rows={requests.map((r) => [
              <span key="type" className="font-semibold text-slate-800 text-xs">
                {r.leave_type?.name || 'Leave'}
              </span>,
              <span key="dates" className="font-mono text-xs text-slate-600">
                {r.start_date} to {r.end_date}
              </span>,
              <span key="days" className="font-bold text-slate-900 text-xs">
                {r.days_count}d
              </span>,
              <span key="reason" className="text-xs text-slate-600 truncate max-w-xs block">
                {r.reason}
              </span>,
              <Badge
                key="status"
                variant={r.status === 'approved' ? 'green' : r.status === 'pending' ? 'yellow' : 'red'}
              >
                {r.status === 'pending' ? 'Pending Admin Approval' : r.status === 'approved' ? 'Approved by Admin' : 'Rejected by Admin'}
              </Badge>,
              <div key="note" className="text-xs">
                {r.status === 'approved' ? (
                  <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Approved {r.approver?.name ? `(${r.approver.name})` : ''}
                  </span>
                ) : r.status === 'rejected' ? (
                  <span
                    className="text-[11px] font-semibold text-rose-700 flex items-center gap-1 cursor-help"
                    title={r.rejection_reason || 'Declined'}
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    {r.rejection_reason || 'Declined by Admin'}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-amber-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Awaiting Admin Decision
                  </span>
                )}
              </div>,
            ])}
          />
        )}
      </div>

      {/* APPLY LEAVE MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Submit Manager Leave Request">
        <form onSubmit={handleApplyLeave} className="space-y-4">
          <p className="text-xs text-slate-600 font-medium">
            Your leave request will be routed directly to the System Administrator for formal approval.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Leave Category</label>
            <select
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            >
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (Annual Quota: {t.annual_quota || t.max_days_per_year || 12} days)
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
              placeholder="State your reason for leave..."
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
              disabled={submitting || !startDate || !endDate || !reason.trim()}
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit to Admin'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
