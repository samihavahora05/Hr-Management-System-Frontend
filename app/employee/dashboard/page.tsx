'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmployeeDashboard } from '@/components/dashboard/EmployeeDashboard';
import { useAuth } from '@/lib/auth-context';
import { fetchApi } from '@/lib/api';
import { Toast } from '@/components/ui/Toast';
import { getCurrentLocation } from '@/lib/geolocation';

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [attRes, balRes, annRes] = await Promise.all([
        fetchApi('/attendance/summary').catch(() => null),
        fetchApi('/leave/balances').catch(() => ({ balances: [] })),
        fetchApi('/announcements').catch(() => ({ announcements: [] })),
      ]);
      setAttendanceSummary(attRes);
      setLeaveBalances(balRes?.balances || []);
      setAnnouncements(annRes?.announcements || []);
    } catch (err: any) {
      setToastMessage('Failed to load employee dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const coords = await getCurrentLocation().catch((err: any) => {
        throw new Error(err.message || 'Office location verification required: Please allow GPS location in your browser.');
      });
      const res = await fetchApi('/attendance/check-in', {
        method: 'POST',
        body: JSON.stringify({
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      });
      setToastMessage(res.message || 'Checked in successfully!');
      await loadData();
    } catch (err: any) {
      setToastMessage(err.message || 'Check-in failed: You must be at the office premises to clock in.');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingIn(true);
    try {
      const res = await fetchApi('/attendance/check-out', { method: 'POST' });
      setToastMessage(res.message || 'Checked out successfully!');
      await loadData();
    } catch (err: any) {
      setToastMessage(err.message || 'Check-out failed');
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <PortalLayout namespace="employee">
      <PageHeader
        title={`Welcome back, ${user?.name || 'Employee'}`}
        description="Personal workspace: today's check-in status, leave quotas, latest payslips, and announcements"
      />

      {loading ? (
        <div className="py-12 flex justify-center text-slate-400 text-xs font-semibold animate-pulse">
          Loading personal workspace data...
        </div>
      ) : (
        <EmployeeDashboard
          user={user}
          summary={attendanceSummary}
          leaveBalances={leaveBalances}
          announcements={announcements}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          checkingIn={checkingIn}
        />
      )}

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
