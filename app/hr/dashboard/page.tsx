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

  return (
    <PortalLayout namespace="hr">
      <PageHeader
        title="HR Command Center"
        description="Workforce attendance, organization insights, employee directory, and task distribution"
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
        />
      )}

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
