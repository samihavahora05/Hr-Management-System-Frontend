'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { fetchApi } from '@/lib/api';
import { Toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Plus, CheckCircle, XCircle, Clock, Users, UserCheck } from '@/components/ui/Icon';

const DEFAULT_LEAVE_TYPES = [
  { id: 1, name: 'Casual Leave (CL)', annual_quota: 12 },
  { id: 2, name: 'Sick Leave (SL)', annual_quota: 10 },
  { id: 3, name: 'Earned / Privilege Leave (PL)', annual_quota: 15 },
  { id: 4, name: 'Maternity / Paternity Leave', annual_quota: 30 },
  { id: 5, name: 'Compensatory Off (Comp-Off)', annual_quota: 5 },
  { id: 6, name: 'Unpaid Leave (LOP)', annual_quota: 0 },
];

export default function ManagerLeavePage() {
  const [activeTab, setActiveTab] = useState<'team' | 'personal'>('team');
  const [teamRequests, setTeamRequests] = useState<any[]>([]);
  const [personalRequests, setPersonalRequests] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>(DEFAULT_LEAVE_TYPES);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Apply Personal Leave Modal State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [leaveTypeId, setLeaveTypeId] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
      const [teamRes, personalRes, typesRes] = await Promise.all([
        fetchApi(`/leave/requests?view_mode=team${statusParam}`).catch(() => ({ leave_requests: [] })),
        fetchApi('/leave/requests?view_mode=personal').catch(() => ({ leave_requests: [] })),
        fetchApi('/leave/types').catch(() => ({ leave_types: DEFAULT_LEAVE_TYPES })),
      ]);

      setTeamRequests(teamRes.leave_requests || []);
      setPersonalRequests(personalRes.leave_requests || []);

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

      setToastMessage('Personal leave request submitted successfully.');
      setIsApplyModalOpen(false);
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

  const handleApprove = async (id: number) => {
    try {
      const res = await fetchApi(`/leave/requests/${id}/approve`, { method: 'POST' });
      setToastMessage(res.message || 'Team leave request approved successfully!');
      await loadData();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to approve leave request');
    }
  };

  const openRejectModal = (id: number) => {
    setSelectedRequestId(id);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestId) return;

    setRejecting(true);
    try {
      const res = await fetchApi(`/leave/requests/${selectedRequestId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejection_reason: rejectionReason }),
      });
      setToastMessage(res.message || 'Leave request declined.');
      setRejectModalOpen(false);
      setSelectedRequestId(null);
      setRejectionReason('');
      await loadData();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to decline leave request');
    } finally {
      setRejecting(false);
    }
  };

  const pendingTeamCount = teamRequests.filter((r) => r.status === 'pending').length;

  return (
    <PortalLayout namespace="manager">
      <PageHeader
        title="Leave Management & Team Approvals"
        description="Review subordinate leave requests, approve time-off applications, and manage your personal leave"
        action={
          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        }
      />

      {/* TAB SWITCHER */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'team'
              ? 'bg-[#0f365e] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Leave Approvals</span>
          {pendingTeamCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950">
              {pendingTeamCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('personal')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'personal'
              ? 'bg-[#0f365e] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>My Applications</span>
        </button>
      </div>

      {activeTab === 'team' ? (
        <div className="space-y-4">
          {/* FILTER CONTROLS */}
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium"
              >
                <option value="all">All Team Requests</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <p className="text-xs font-medium text-slate-500">
              Showing {teamRequests.length} team application{teamRequests.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 font-medium">
                Loading team leave applications...
              </div>
            ) : teamRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-medium">
                No team leave applications found matching current criteria.
              </div>
            ) : (
              <TablePrimitive
                headers={['Employee', 'Leave Type', 'Duration', 'Days', 'Reason', 'Status', 'Review Actions']}
                rows={teamRequests.map((r) => [
                  <div key="emp">
                    <p className="font-extrabold text-slate-900 text-xs">{r.user?.name || 'Staff'}</p>
                    <p className="text-[10px] font-mono text-slate-400">{r.user?.employee_code || ''}</p>
                  </div>,
                  <span key="type" className="font-semibold text-slate-800 text-xs">
                    {r.leave_type?.name || 'Leave'}
                  </span>,
                  <span key="dates" className="font-mono text-xs text-slate-600">
                    {r.start_date} to {r.end_date}
                  </span>,
                  <span key="days" className="font-bold text-slate-900 text-xs">
                    {r.days_count}d
                  </span>,
                  <span key="reason" className="text-xs text-slate-600 truncate max-w-xs block" title={r.reason}>
                    {r.reason}
                  </span>,
                  <Badge
                    key="status"
                    variant={r.status === 'approved' ? 'green' : r.status === 'pending' ? 'yellow' : 'red'}
                  >
                    {r.status}
                  </Badge>,
                  <div key="actions" className="flex items-center gap-1.5">
                    {r.status === 'pending' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Awaiting Admin Approval</span>
                      </span>
                    ) : r.status === 'approved' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Approved by {r.approver?.name || 'Admin'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700" title={r.rejection_reason}>
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Declined {r.rejection_reason ? `(${r.rejection_reason})` : ''}</span>
                      </span>
                    )}
                  </div>,
                ])}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">
              Loading your personal leave applications...
            </div>
          ) : personalRequests.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-medium">
              You have not submitted any personal leave requests.
            </div>
          ) : (
            <TablePrimitive
              headers={['Leave Type', 'Duration', 'Days', 'Reason', 'Approval Status', 'Decision']}
              rows={personalRequests.map((r) => [
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
                  {r.status}
                </Badge>,
                <div key="note" className="text-xs">
                  {r.status === 'approved' ? (
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Approved {r.approver?.name ? `(${r.approver.name})` : ''}
                    </span>
                  ) : r.status === 'rejected' ? (
                    <span className="text-[11px] font-semibold text-rose-700 flex items-center gap-1" title={r.rejection_reason}>
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      {r.rejection_reason || 'Declined'}
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-amber-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Pending Decision
                    </span>
                  )}
                </div>,
              ])}
            />
          )}
        </div>
      )}

      {/* APPLY LEAVE MODAL */}
      <Modal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} title="Submit Personal Leave Request">
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
                  {t.name} (Annual Quota: {t.annual_quota || 12} days)
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
              placeholder="State reason..."
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(false)}
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

      {/* REJECT LEAVE MODAL */}
      <Modal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Decline Leave Request">
        <form onSubmit={handleConfirmReject} className="space-y-4">
          <p className="text-xs text-slate-600">
            Please provide a brief reason for declining this team leave request:
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Rejection Reason</label>
            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="e.g. Critical project deadline, overlapping team absence..."
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rejecting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {rejecting ? 'Processing...' : 'Confirm Decline'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
