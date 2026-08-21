'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { fetchApi } from '@/lib/api';
import { exportToCSV } from '@/lib/export';
import { Download } from '@/components/ui/Icon';

export default function AdminLeavePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

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
      const reqRes = await fetchApi(url);
      setRequests(reqRes.leave_requests || []);
    } catch (err) {
      setToastMessage('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await fetchApi(`/leave/requests/${id}/approve`, { method: 'POST' });
      setToastMessage('Leave request approved successfully');
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
    exportToCSV('Admin_Leave_Management_Report', headers, rows);
    setToastMessage('Leave records exported to Excel CSV format successfully!');
  };

  return (
    <PortalLayout namespace="admin">
      <PageHeader
        title="Admin System Leave Management"
        description="System-wide review and processing of employee leave applications across all departments"
        action={
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            title="Export leave records to Excel CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export to Excel</span>
          </button>
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
            Loading system leave applications...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">
            No leave requests found.
          </div>
        ) : (
          <TablePrimitive
            headers={['Employee', 'Leave Type', 'Duration', 'Days', 'Reason', 'Status', 'Actions']}
            rows={requests.map((r) => [
              <div key="emp">
                <p className="font-extrabold text-slate-900 text-xs">
                  {r.user?.name || `Employee #${r.user_id}`}
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
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono">Processed</span>
                )}
              </div>,
            ])}
          />
        )}
      </div>

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
