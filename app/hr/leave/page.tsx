'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { exportToCSV } from '@/lib/export';
import { Plus, Download, CheckCircle, XCircle } from '@/components/ui/Icon';

export default function HRLeavePage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Apply Leave Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reject Leave Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectRequestId, setRejectRequestId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadLeaveRequests();
  }, [statusFilter]);

  const loadLeaveRequests = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/leave/requests?status=${statusFilter}` : '/leave/requests';
      const [reqRes, typeRes] = await Promise.all([
        fetchApi(url),
        fetchApi('/leave/types').catch(() => ({ leave_types: [] })),
      ]);

      setRequests(reqRes.leave_requests || []);
      setLeaveTypes(typeRes.leave_types || []);
      if (typeRes.leave_types?.length > 0) {
        setLeaveTypeId(typeRes.leave_types[0].id.toString());
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

      setToastMessage('Personal leave request submitted successfully! It will be reviewed by Management/Admin.');
      setIsModalOpen(false);
      setReason('');
      setStartDate('');
      setEndDate('');
      await loadLeaveRequests();
    } catch (err: any) {
      setToastMessage(err.message || 'Leave application failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await fetchApi(`/leave/requests/${id}/approve`, { method: 'POST' });
      setToastMessage('Leave request approved');
      await loadLeaveRequests();
    } catch (err: any) {
      setToastMessage(err.message || 'Approval failed');
    }
  };

  const openRejectModal = (id: number) => {
    setRejectRequestId(id);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectRequestId) return;
    setRejectSubmitting(true);
    try {
      await fetchApi(`/leave/requests/${rejectRequestId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejection_reason: rejectionReason }),
      });
      setToastMessage('Leave request rejected');
      setRejectModalOpen(false);
      setRejectRequestId(null);
      setRejectionReason('');
      await loadLeaveRequests();
    } catch (err: any) {
      setToastMessage(err.message || 'Rejection failed');
    } finally {
      setRejectSubmitting(false);
    }
  };

  const handleExportExcel = () => {
    if (requests.length === 0) {
      setToastMessage('No leave application data available to export.');
      return;
    }
    const headers = ['Employee Name', 'Code', 'Leave Type', 'Start Date', 'End Date', 'Days Count', 'Reason', 'Status'];
    const rows = requests.map((r) => [
      r.user?.name || `Employee #${r.user_id}`,
      r.user?.employee_code || '',
      r.leave_type?.name || 'Leave',
      r.start_date,
      r.end_date,
      r.days_count,
      r.reason || 'N/A',
      r.status,
    ]);
    exportToCSV('Leave_Applications_Report', headers, rows);
    setToastMessage('Leave records exported to Excel CSV format successfully!');
  };

  return (
    <PortalLayout namespace="hr">
      <PageHeader
        title="Organization Leave Management"
        description="Review and process employee leave applications across all departments, or submit your own personal leave request"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              title="Export leave records to Excel CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export to Excel</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Apply for My Leave</span>
            </button>
          </div>
        }
      />

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs mb-6 flex justify-between items-center">
        <span className="text-xs font-bold text-slate-700">Filter by Status</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
        >
          <option value="">All Applications</option>
          <option value="pending">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium">
            Loading leave applications from database...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">
            No leave requests found.
          </div>
        ) : (
          <TablePrimitive
            headers={['Employee', 'Leave Type', 'Duration', 'Days', 'Reason', 'Status', 'Actions']}
            rows={requests.map((r) => {
              const isOwnRequest = r.user_id === user?.id;

              return [
                <div key="emp">
                  <p className="font-extrabold text-slate-900 text-xs">
                    {r.user?.name || `Employee #${r.user_id}`} {isOwnRequest && <span className="text-[10px] text-sky-700 font-bold">(You)</span>}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">{r.user?.employee_code || ''}</p>
                </div>,
                <span key="type" className="font-semibold text-slate-800 text-xs">{r.leave_type?.name || 'Leave'}</span>,
                <span key="dates" className="font-mono text-xs text-slate-600">{r.start_date} to {r.end_date}</span>,
                <span key="days" className="font-bold text-slate-900 text-xs">{r.days_count}d</span>,
                <span key="reason" className="text-xs text-slate-600 truncate max-w-xs block">{r.reason}</span>,
                <Badge key="status" variant={r.status === 'approved' ? 'green' : r.status === 'pending' ? 'yellow' : 'red'}>
                  {r.status}
                </Badge>,
                <div key="actions" className="flex items-center gap-1">
                  {r.status === 'pending' ? (
                    isOwnRequest ? (
                      <span className="text-[10px] text-amber-700 font-mono font-bold">Pending Manager Review</span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleApprove(r.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectModal(r.id)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )
                  ) : r.status === 'approved' ? (
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Approved {r.approver?.name ? `by ${r.approver.name}` : ''}
                    </span>
                  ) : (
                    <span
                      className="text-[11px] font-semibold text-rose-700 flex items-center gap-1 cursor-help"
                      title={r.rejection_reason || 'Declined'}
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      Rejected {r.approver?.name ? `by ${r.approver.name}` : ''}
                    </span>
                  )}
                </div>,
              ];
            })}
          />
        )}
      </div>

      {/* APPLY LEAVE MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Submit HR Personal Leave Request">
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
              placeholder="State your reason for personal leave..."
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

      {/* REJECT LEAVE MODAL */}
      <Modal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Reject Leave Application">
        <form onSubmit={handleConfirmReject} className="space-y-4">
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Please specify the reason for rejecting this leave application. This justification will be sent to the employee.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              placeholder="e.g. Insufficient team coverage during project delivery..."
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rejectSubmitting || !rejectionReason.trim()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              {rejectSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
