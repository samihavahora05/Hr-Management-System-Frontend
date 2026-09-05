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
  // Date & Search Filtering State
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getThisWeekRange = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const fmt = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    return { start: fmt(monday), end: fmt(sunday) };
  };

  const getThisMonthRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    return {
      start: `${year}-${month}-01`,
      end: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
    };
  };

  const handlePresetSelect = (preset: 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom') => {
    setDatePreset(preset);
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      const today = getTodayStr();
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'yesterday') {
      const yesterday = getYesterdayStr();
      setStartDate(yesterday);
      setEndDate(yesterday);
    } else if (preset === 'this_week') {
      const { start, end } = getThisWeekRange();
      setStartDate(start);
      setEndDate(end);
    } else if (preset === 'this_month') {
      const { start, end } = getThisMonthRange();
      setStartDate(start);
      setEndDate(end);
    }
  };

  const handleResetFilters = () => {
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
    setSearchQuery('');
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
    exportToCSV('HR_Attendance_Register', headers, rows);
    setToastMessage('Attendance Register exported to Excel CSV format successfully!');
  };

  const filteredAttendances = attendances.filter((a) => {
    const itemDate = formatDate(a.date);

    // Date range filter
    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'present') {
        if (a.status !== 'present' && a.status !== 'late') return false;
      } else if (a.status !== statusFilter) {
        return false;
      }
    }

    // Search query filter (name, employee code, notes)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const name = (a.user?.name || '').toLowerCase();
      const code = (a.user?.employee_code || '').toLowerCase();
      const notes = (a.notes || '').toLowerCase();
      if (!name.includes(q) && !code.includes(q) && !notes.includes(q)) {
        return false;
      }
    }

    return true;
  });

  const isFilterActive = datePreset !== 'all' || startDate !== '' || endDate !== '' || statusFilter !== 'all' || searchQuery.trim() !== '';

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

      {/* COMPREHENSIVE DATE & SEARCH FILTER BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-5 shadow-2xs space-y-3.5">
        {/* Row 1: Quick Date Presets & Status Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mr-1">Date:</span>
            {[
              { id: 'all', label: 'All History' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'custom', label: 'Custom Range' },
            ].map((p) => {
              const active = datePreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePresetSelect(p.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#0f365e] text-white shadow-2xs scale-95'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 font-bold rounded-xl px-3 py-1.5 text-slate-800 outline-none focus:ring-2 focus:ring-[#0f365e] focus:bg-white transition-all cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present (On-Time & Late)</option>
              <option value="late">Late Only</option>
              <option value="on_leave">On Leave</option>
              <option value="absent">Absent</option>
            </select>
          </div>
        </div>

        {/* Row 2: Date Range Inputs, Search Input, and Reset */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-3 border-t border-slate-100">
          {/* Employee Live Search */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by employee name, code, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3.5 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#0f365e] focus:ring-2 focus:ring-[#0f365e]/20 outline-none transition-all font-medium"
            />
          </div>

          {/* Date Pickers (From / To) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="text-xs bg-transparent border-0 font-bold text-slate-800 outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">To</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="text-xs bg-transparent border-0 font-bold text-slate-800 outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Reset All Filters Button */}
          {isFilterActive && (
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              title="Reset all filters and show full history"
            >
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Active Filter Chips / Status Feedback */}
        {isFilterActive && (
          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-600">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400">Active Filters:</span>
              {startDate && endDate && (
                <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-[#0f365e] rounded-md font-bold">
                  📅 {startDate === endDate ? `Date: ${startDate}` : `${startDate} → ${endDate}`}
                </span>
              )}
              {startDate && !endDate && (
                <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-[#0f365e] rounded-md font-bold">
                  📅 From {startDate}
                </span>
              )}
              {!startDate && endDate && (
                <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-[#0f365e] rounded-md font-bold">
                  📅 Up to {endDate}
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md font-bold uppercase">
                  ⚡ Status: {statusFilter.replace('_', ' ')}
                </span>
              )}
              {searchQuery && (
                <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-md font-bold">
                  🔍 "{searchQuery}"
                </span>
              )}
            </div>

            <span className="text-slate-500 font-bold">
              Showing <strong>{filteredAttendances.length}</strong> {filteredAttendances.length === 1 ? 'record' : 'records'}
            </span>
          </div>
        )}
      </div>

      {/* ATTENDANCE TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium">
            Fetching organization attendance history...
          </div>
        ) : filteredAttendances.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium space-y-2">
            <p>No attendance records found matching the active filters.</p>
            {isFilterActive && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-[#0f365e] hover:underline cursor-pointer"
              >
                Clear all filters to view full history
              </button>
            )}
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
