'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { fetchApi } from '@/lib/api';
import { exportToCSV } from '@/lib/export';
import { Toast } from '@/components/ui/Toast';
import { Download } from '@/components/ui/Icon';

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  if (dateStr.includes('T')) {
    return dateStr.split('T')[0];
  }
  return dateStr;
}

function formatTime(timeStr?: string): string {
  if (!timeStr) return '--:--';
  if (timeStr.includes('T')) {
    const d = new Date(timeStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }
  return timeStr;
}

function formatAttendanceNotes(notes?: string): string {
  if (!notes) return 'On-time check-in';
  return notes.replace(/Late by (-?\d+(?:\.\d+)?) mins/g, (_, p1) => {
    const totalMins = Math.round(Math.abs(parseFloat(p1)));
    if (isNaN(totalMins) || totalMins === 0) return 'Late check-in';
    if (totalMins < 60) {
      return `Late by ${totalMins} mins`;
    }
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    const hrStr = `${hours} ${hours > 1 ? 'hrs' : 'hr'}`;
    if (mins === 0) {
      return `Late by ${hrStr}`;
    }
    return `Late by ${hrStr} ${mins} mins`;
  });
}

export default function HRAttendancePage() {
  const [summary, setSummary] = useState<any>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'late' | 'on_leave' | 'absent'>('all');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, histRes] = await Promise.all([
        fetchApi('/attendance/summary').catch(() => null),
        fetchApi('/attendance/history').catch(() => ({ attendances: [] })),
      ]);
      setSummary(sumRes?.summary || null);
      setAttendances(histRes?.attendances || []);
    } catch (err) {
      setToastMessage('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (filteredAttendances.length === 0) {
      setToastMessage('No attendance records available to export.');
      return;
    }
    const headers = ['Date', 'Employee Name', 'Employee Code', 'Check In', 'Check Out', 'Status', 'Notes'];
    const rows = filteredAttendances.map((a) => [
      formatDate(a.date),
      a.user?.name || `Employee #${a.user_id}`,
      a.user?.employee_code || '',
      formatTime(a.check_in),
      formatTime(a.check_out),
      a.status || 'present',
      a.notes || 'N/A',
    ]);
    exportToCSV('Attendance_Register', headers, rows);
    setToastMessage('Attendance Register exported to Excel CSV format successfully!');
  };

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const filteredAttendances = attendances.filter((a) => {
    if (statusFilter === 'all') return true;
    const itemDate = formatDate(a.date);
    const todayStr = getTodayStr();
    if (statusFilter === 'present') {
      return (a.status === 'present' || a.status === 'late') && itemDate === todayStr;
    }
    return a.status === statusFilter && itemDate === todayStr;
  });

  return (
    <PortalLayout namespace="hr">
      <PageHeader
        title="Organization Attendance Register"
        description="Daily check-in logs, punctuality metrics, late instances, and attendance audit trail"
        action={
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            title="Export attendance records to Excel CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export to Excel</span>
          </button>
        }
      />

      {/* INTERACTIVE SUMMARY CARDS */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div
            onClick={() => setStatusFilter('all')}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]'
                : 'bg-white text-slate-900 border-slate-200 shadow-2xs hover:border-slate-400 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'all' ? 'text-slate-300' : 'text-slate-400'}`}>
                Total Active
              </p>
              <span className="text-[10px] font-semibold opacity-75">All</span>
            </div>
            <p className="text-2xl font-extrabold mt-1">{summary.total_employees}</p>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'present' ? 'all' : 'present')}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
              statusFilter === 'present'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]'
                : 'bg-white border-slate-200 shadow-2xs hover:border-emerald-400 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'present' ? 'text-emerald-100' : 'text-slate-400'}`}>
                Present Today
              </p>
              {statusFilter === 'present' && <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded">Filtered</span>}
            </div>
            <p className={`text-2xl font-extrabold mt-1 ${statusFilter === 'present' ? 'text-white' : 'text-emerald-600'}`}>
              {summary.present_today}
            </p>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'late' ? 'all' : 'late')}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
              statusFilter === 'late'
                ? 'bg-amber-600 text-white border-amber-600 shadow-md scale-[1.02]'
                : 'bg-white border-slate-200 shadow-2xs hover:border-amber-400 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'late' ? 'text-amber-100' : 'text-slate-400'}`}>
                Late Check-ins
              </p>
              {statusFilter === 'late' && <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded">Filtered</span>}
            </div>
            <p className={`text-2xl font-extrabold mt-1 ${statusFilter === 'late' ? 'text-white' : 'text-amber-600'}`}>
              {summary.late_today}
            </p>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'on_leave' ? 'all' : 'on_leave')}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
              statusFilter === 'on_leave'
                ? 'bg-sky-700 text-white border-sky-700 shadow-md scale-[1.02]'
                : 'bg-white border-slate-200 shadow-2xs hover:border-sky-400 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'on_leave' ? 'text-sky-100' : 'text-slate-400'}`}>
                On Leave
              </p>
              {statusFilter === 'on_leave' && <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded">Filtered</span>}
            </div>
            <p className={`text-2xl font-extrabold mt-1 ${statusFilter === 'on_leave' ? 'text-white' : 'text-[#0f365e]'}`}>
              {summary.on_leave_today}
            </p>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'absent' ? 'all' : 'absent')}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
              statusFilter === 'absent'
                ? 'bg-rose-700 text-white border-rose-700 shadow-md scale-[1.02]'
                : 'bg-white border-slate-200 shadow-2xs hover:border-rose-400 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'absent' ? 'text-rose-100' : 'text-slate-400'}`}>
                Absent Today
              </p>
              {statusFilter === 'absent' && <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded">Filtered</span>}
            </div>
            <p className={`text-2xl font-extrabold mt-1 ${statusFilter === 'absent' ? 'text-white' : 'text-rose-600'}`}>
              {summary.absent_today}
            </p>
          </div>
        </div>
      )}

      {/* FILTER ACTIVE RESET BANNER */}
      {statusFilter !== 'all' && (
        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 px-4 py-2.5 rounded-xl mb-4 text-xs font-semibold text-indigo-900 shadow-2xs">
          <span>Filtering today's logs by status: <strong className="uppercase font-extrabold tracking-wide">{statusFilter.replace('_', ' ')} TODAY</strong></span>
          <button
            onClick={() => setStatusFilter('all')}
            className="text-indigo-700 hover:text-indigo-950 font-extrabold underline cursor-pointer"
          >
            Clear Filter (Show All History)
          </button>
        </div>
      )}

      {/* ATTENDANCE TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium">
            Fetching organization attendance history...
          </div>
        ) : filteredAttendances.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">
            No attendance records found matching status filter "{statusFilter.toUpperCase()}".
          </div>
        ) : (
          <TablePrimitive
            headers={['Date', 'Employee', 'Check In', 'Check Out', 'Status', 'Notes']}
            rows={filteredAttendances.map((a) => [
              <span key="date" className="font-mono text-xs text-slate-900 font-bold">{formatDate(a.date)}</span>,
              <div key="user">
                <p className="font-bold text-slate-900 text-xs">{a.user?.name || `Employee #${a.user_id}`}</p>
                <p className="text-[10px] font-mono text-slate-400">{a.user?.employee_code || ''}</p>
              </div>,
              <span key="in" className="font-mono text-xs text-slate-800 font-semibold">{formatTime(a.check_in)}</span>,
              <span key="out" className="font-mono text-xs text-slate-800 font-semibold">{formatTime(a.check_out)}</span>,
              <Badge key="status" variant={a.status === 'present' ? 'green' : a.status === 'late' ? 'amber' : a.status === 'on_leave' ? 'blue' : 'red'}>
                {a.status === 'late' ? 'LATE' : a.status ? a.status.toUpperCase() : 'ABSENT'}
              </Badge>,
              <span key="notes" className={`text-xs ${a.status === 'late' ? 'text-amber-700 font-bold' : 'text-slate-500'}`}>
                {formatAttendanceNotes(a.notes)}
              </span>,
            ])}
          />
        )}
      </div>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
