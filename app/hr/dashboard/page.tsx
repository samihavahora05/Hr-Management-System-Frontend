'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { HRDashboard } from '@/components/dashboard/HRDashboard';
import { fetchApi } from '@/lib/api';
import { Toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';

export default function HRDashboardPage() {
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectRequestId, setRejectRequestId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [attRes, leaveRes, insightsRes] = await Promise.all([
        fetchApi('/attendance/summary').catch(() => null),
        fetchApi('/leave/requests').catch(() => ({ leave_requests: [] })),
        fetchApi('/insights').catch(() => null),
      ]);
      setAttendanceSummary(attRes);
      setLeaveRequests(leaveRes?.leave_requests || []);
      setInsights(insightsRes);
    } catch (err: any) {
      setToastMessage('Failed to load HR dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (id: number) => {
    try {
      await fetchApi(`/leave/requests/${id}/approve`, { method: 'POST' });
      setToastMessage('Leave request approved successfully');
      await loadData();
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
      await loadData();
    } catch (err: any) {
      setToastMessage(err.message || 'Rejection failed');
    } finally {
      setRejectSubmitting(false);
    }
  };

  return (
    <PortalLayout namespace="hr">
      <PageHeader
        title="HR Command Center"
        description="Workforce attendance, organization leave approvals queue, and AI attrition insights"
      />

      {loading ? (
        <div className="py-12 flex justify-center text-slate-400 text-xs font-semibold animate-pulse">
          Loading HR dashboard data from database...
        </div>
      ) : (
        <HRDashboard
          summary={attendanceSummary?.summary}
          insights={insights}
          leaveRequests={leaveRequests}
          onApproveLeave={handleApproveLeave}
          onRejectLeave={openRejectModal}
        />
      )}

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
