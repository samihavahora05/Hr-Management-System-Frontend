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

export default function ManagerAttendancePage() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchApi('/attendance/history')
      .then((res) => setAttendances(res.attendances || []))
      .catch(() => setAttendances([]))
      .finally(() => setLoading(false));
  }, []);

  const handleExportExcel = () => {
    if (attendances.length === 0) {
      setToastMessage('No team attendance data available to export.');
      return;
    }
    const headers = ['Date', 'Team Member Name', 'Employee Code', 'Check In', 'Check Out', 'Status', 'Notes'];
    const rows = attendances.map((a) => [
      formatDate(a.date),
      a.user?.name || `Employee #${a.user_id}`,
      a.user?.employee_code || '',
      formatTime(a.check_in),
      formatTime(a.check_out),
      a.status || 'present',
      a.notes || 'N/A',
    ]);
    exportToCSV('Team_Attendance_Tracking', headers, rows);
    setToastMessage('Team attendance tracking data exported to Excel CSV format successfully!');
  };

  return (
    <PortalLayout namespace="manager">
      <PageHeader
        title="Team Attendance Tracking"
        description="Daily check-in logs, punctuality, and attendance history for your direct team"
        action={
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            title="Export team attendance to Excel CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export to Excel</span>
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium">
            Fetching team attendance history...
          </div>
        ) : attendances.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">
            No attendance records found for your team.
          </div>
        ) : (
          <TablePrimitive
            headers={['Date', 'Team Member', 'Check In', 'Check Out', 'Status']}
            rows={attendances.map((a) => [
              <span key="date" className="font-mono text-xs text-slate-900 font-bold">{formatDate(a.date)}</span>,
              <div key="user">
                <p className="font-bold text-slate-900 text-xs">{a.user?.name || `Employee #${a.user_id}`}</p>
                <p className="text-[10px] font-mono text-slate-400">{a.user?.employee_code || ''}</p>
              </div>,
              <span key="in" className="font-mono text-xs text-slate-800 font-semibold">{formatTime(a.check_in)}</span>,
              <span key="out" className="font-mono text-xs text-slate-800 font-semibold">{formatTime(a.check_out)}</span>,
              <Badge key="status" variant={a.status === 'present' ? 'green' : a.status === 'late' ? 'yellow' : a.status === 'on_leave' ? 'blue' : 'red'}>
                {a.status}
              </Badge>,
            ])}
          />
        )}
      </div>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
