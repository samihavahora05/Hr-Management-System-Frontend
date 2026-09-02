'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { exportToCSV } from '@/lib/export';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import {
  CalendarDays,
  Clock,
  Download,
  Search,
  Filter,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ChevronRight,
  ChevronLeft,
  Building2,
  Eye,
  Trash2,
  Sparkles,
} from '@/components/ui/Icon';

interface MonthlyAttendanceReportViewProps {
  initialMonth?: string;
  onNavigateBack?: () => void;
}

export function MonthlyAttendanceReportView({
  initialMonth,
  onNavigateBack,
}: MonthlyAttendanceReportViewProps) {
  // Current Month State (YYYY-MM)
  const getInitialMonth = () => {
    if (initialMonth && /^\d{4}-\d{2}$/.test(initialMonth)) return initialMonth;
    const d = new Date();
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    return `${yr}-${mo}`;
  };

  const [selectedMonth, setSelectedMonth] = useState<string>(getInitialMonth());
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'outstanding' | 'good' | 'average' | 'needs_attention'>('all');
  const [activeTab, setActiveTab] = useState<'summary' | 'matrix' | 'stored'>('summary');

  // Data States
  const [reportData, setReportData] = useState<any>(null);
  const [storedReports, setStoredReports] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // Storing Modal
  const [isStoreModalOpen, setIsStoreModalOpen] = useState<boolean>(false);
  const [storeTitle, setStoreTitle] = useState<string>('');
  const [storeNotes, setStoreNotes] = useState<string>('');
  const [storing, setStoring] = useState<boolean>(false);

  // Employee Drilldown Modal
  const [drilldownEmployee, setDrilldownEmployee] = useState<any | null>(null);

  // Active Loaded Snapshot (if viewing stored snapshot)
  const [loadedSnapshotInfo, setLoadedSnapshotInfo] = useState<any | null>(null);

  useEffect(() => {
    loadMonthlyReport(selectedMonth, selectedDepartment);
    loadStoredReportsList();
  }, [selectedMonth, selectedDepartment]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(msg);
    setToastType(type);
  };

  const loadMonthlyReport = async (month: string, dept: string) => {
    setLoading(true);
    setLoadedSnapshotInfo(null);
    try {
      const queryParams = new URLSearchParams({
        month,
        department: dept,
      });
      const res = await fetchApi(`/reports/monthly-attendance?${queryParams.toString()}`);
      setReportData(res);

      // Extract departments from records if available
      if (res && res.records) {
        const depts = Array.from(new Set(res.records.map((r: any) => r.department).filter(Boolean))) as string[];
        setDepartments(depts);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to load monthly attendance report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStoredReportsList = async () => {
    try {
      const res = await fetchApi('/reports/monthly-attendance/stored');
      setStoredReports(res?.stored_reports || []);
    } catch (err) {
      // Non-critical
    }
  };

  const handlePrevMonth = () => {
    const [yrStr, moStr] = selectedMonth.split('-');
    let yr = parseInt(yrStr, 10);
    let mo = parseInt(moStr, 10) - 1;
    if (mo < 1) {
      mo = 12;
      yr -= 1;
    }
    const newMonth = `${yr}-${String(mo).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const handleNextMonth = () => {
    const [yrStr, moStr] = selectedMonth.split('-');
    let yr = parseInt(yrStr, 10);
    let mo = parseInt(moStr, 10) + 1;
    if (mo > 12) {
      mo = 1;
      yr += 1;
    }
    const newMonth = `${yr}-${String(mo).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const handleOpenStoreModal = () => {
    const monthName = reportData?.month_name || selectedMonth;
    const defaultTitle = `Monthly Attendance Register - ${monthName}${selectedDepartment !== 'all' ? ` (${selectedDepartment})` : ''}`;
    setStoreTitle(defaultTitle);
    setStoreNotes(`Official verified monthly attendance snapshot for ${monthName}.`);
    setIsStoreModalOpen(true);
  };

  const handleStoreReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setStoring(true);
    try {
      const res = await fetchApi('/reports/monthly-attendance/store', {
        method: 'POST',
        body: JSON.stringify({
          month: selectedMonth,
          department: selectedDepartment,
          title: storeTitle,
          notes: storeNotes,
        }),
      });

      showToast(res?.message || 'Monthly attendance report stored and archived successfully!', 'success');
      setIsStoreModalOpen(false);
      await loadStoredReportsList();
    } catch (err: any) {
      showToast(err?.message || 'Failed to store monthly attendance report', 'error');
    } finally {
      setStoring(false);
    }
  };

  const handleLoadStoredSnapshot = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetchApi(`/reports/monthly-attendance/stored/${id}`);
      if (res?.report) {
        const stored = res.report;
        setReportData({
          month: stored.month,
          year: stored.year,
          month_name: stored.month_name,
          total_employees: stored.total_employees,
          total_working_days: stored.total_working_days,
          avg_attendance_percentage: stored.avg_attendance_percentage,
          avg_performance_rate: stored.avg_performance_rate,
          calendar_days: stored.records?.[0]?.daily_punches?.map((p: any) => ({
            day: p.day,
            date: p.date,
            day_name: p.day_name,
            is_weekend: p.is_weekend,
          })) || [],
          summary: stored.summary,
          records: stored.records,
        });
        setLoadedSnapshotInfo(stored);
        setSelectedMonth(stored.month);
        setActiveTab('summary');
        showToast(`Loaded stored snapshot: "${stored.title}"`, 'info');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to load stored snapshot', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStoredSnapshot = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete the stored snapshot "${title}"?`)) return;
    try {
      const res = await fetchApi(`/reports/monthly-attendance/stored/${id}`, {
        method: 'DELETE',
      });
      showToast(res?.message || 'Stored report snapshot deleted', 'success');
      if (loadedSnapshotInfo && loadedSnapshotInfo.id === id) {
        setLoadedSnapshotInfo(null);
        await loadMonthlyReport(selectedMonth, selectedDepartment);
      }
      await loadStoredReportsList();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete stored snapshot', 'error');
    }
  };

  const handleExportCSV = () => {
    if (!reportData || !reportData.records || reportData.records.length === 0) {
      showToast('No attendance records to export.', 'error');
      return;
    }

    const calendarDays = reportData.calendar_days || [];
    const headers = [
      'Employee Code',
      'Employee Name',
      'Department',
      'Designation',
      'Performance Rate (%)',
      'Performance Rating',
      'Attendance Rate (%)',
      'Punctuality Rate (%)',
      'Working Days',
      'Present Days',
      'Late Check-ins',
      'Half Days',
      'Absent Days',
      'Leave Days',
      'Total Hours Logged',
      'Avg Daily Hours',
      ...calendarDays.map((d: any) => `Day ${d.day} (${d.day_name})`),
    ];

    const rows = filteredRecords.map((r: any) => {
      const punches = r.daily_punches || [];
      const punchValues = calendarDays.map((d: any) => {
        const p = punches.find((item: any) => item.day === d.day);
        if (!p) return 'N/A';
        if (p.status === 'week_off') return 'WEEKEND';
        if (p.status === 'on_leave') return 'LEAVE';
        if (p.status === 'absent') return 'ABSENT';
        if (p.status === 'present') return `P (${p.check_in ? p.check_in.substring(0, 5) : 'OK'} - ${p.check_out ? p.check_out.substring(0, 5) : 'OK'})`;
        if (p.status === 'late') return `LATE (${p.check_in ? p.check_in.substring(0, 5) : 'Late'})`;
        if (p.status === 'half_day') return `HALF_DAY (${p.hours_worked}h)`;
        return p.status.toUpperCase();
      });

      return [
        r.employee_code,
        r.name,
        r.department,
        r.designation,
        `${r.performance_rate}%`,
        r.performance_rating,
        `${r.attendance_percentage}%`,
        `${r.punctuality_rate}%`,
        r.working_days,
        r.present_days,
        r.late_days,
        r.half_days,
        r.absent_days,
        r.leave_days,
        `${r.total_hours} hrs`,
        `${r.avg_daily_hours} hrs`,
        ...punchValues,
      ];
    });

    const filename = `Monthly_Attendance_${reportData.month}_Register`;
    exportToCSV(filename, headers, rows);
    showToast('Monthly attendance report exported to Excel CSV successfully!', 'success');
  };

  // Filtered Records based on search and performance filter
  const records = reportData?.records || [];
  const filteredRecords = records.filter((r: any) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (r.name || '').toLowerCase().includes(q);
      const matchCode = (r.employee_code || '').toLowerCase().includes(q);
      const matchDept = (r.department || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchDept) return false;
    }

    if (performanceFilter === 'outstanding' && r.performance_rate < 95) return false;
    if (performanceFilter === 'good' && (r.performance_rate < 85 || r.performance_rate >= 95)) return false;
    if (performanceFilter === 'average' && (r.performance_rate < 75 || r.performance_rate >= 85)) return false;
    if (performanceFilter === 'needs_attention' && r.performance_rate >= 75) return false;

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 border border-emerald-300">P</span>;
      case 'late':
        return <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded bg-amber-100 text-amber-800 border border-amber-300">L</span>;
      case 'half_day':
        return <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded bg-purple-100 text-purple-800 border border-purple-300">HD</span>;
      case 'on_leave':
        return <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded bg-sky-100 text-sky-800 border border-sky-300">OL</span>;
      case 'absent':
        return <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded bg-rose-100 text-rose-800 border border-rose-300">A</span>;
      case 'week_off':
        return <span className="w-5 h-5 flex items-center justify-center text-[10px] font-medium rounded bg-slate-100 text-slate-400 border border-slate-200">WO</span>;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-[10px] font-medium rounded bg-slate-50 text-slate-300">-</span>;
    }
  };

  const getPerformanceBadge = (rating: string, rate: number) => {
    let colorClasses = 'bg-slate-100 text-slate-800 border-slate-200';
    if (rate >= 95) {
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    } else if (rate >= 85) {
      colorClasses = 'bg-sky-50 text-sky-800 border-sky-200';
    } else if (rate >= 75) {
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
    } else {
      colorClasses = 'bg-rose-50 text-rose-800 border-rose-200';
    }

    return (
      <div className="flex items-center gap-1.5">
        <span className={`px-2 py-0.5 text-[11px] font-extrabold rounded-md border ${colorClasses}`}>
          {rate}% • {rating}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* TOP HEADER CONTROLS BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
                <span>Monthly Attendance Register & Performance Analytics</span>
              </h2>
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                Admin Exclusive
              </span>
              {loadedSnapshotInfo && (
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Viewing Stored Snapshot ({new Date(loadedSnapshotInfo.created_at).toLocaleDateString()})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Comprehensive month-level attendance matrix, employee performance rates, working hours, and database snapshot storage
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-2">
            {onNavigateBack && (
              <button
                onClick={onNavigateBack}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Back
              </button>
            )}

            <button
              onClick={handleOpenStoreModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              title="Store this complete monthly attendance report in the database"
            >
              <FileText className="w-4 h-4" />
              <span>Store / Save Monthly Report</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              title="Export complete monthly attendance matrix to Excel CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export to Excel CSV</span>
            </button>
          </div>
        </div>

        {/* MONTH SELECTOR & FILTER ROW */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* MONTH NAVIGATOR */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
              <CalendarDays className="w-4 h-4 text-indigo-600" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  if (e.target.value) setSelectedMonth(e.target.value);
                }}
                className="bg-transparent text-xs font-black text-slate-800 focus:outline-hidden cursor-pointer"
              />
            </div>

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {loadedSnapshotInfo && (
              <button
                onClick={() => loadMonthlyReport(selectedMonth, selectedDepartment)}
                className="ml-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
              >
                Switch to Live Calculation
              </button>
            )}
          </div>

          {/* DEPARTMENT & SEARCH FILTERS */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search employee name / code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8.5 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-52 font-medium"
              />
            </div>

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:bg-white focus:outline-hidden"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      {reportData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Workforce</p>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-black text-slate-900">{reportData.total_employees}</p>
              <span className="text-[11px] font-semibold text-slate-500 font-mono">
                {reportData.total_working_days} Work Days
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">Avg Attendance Rate</p>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-black text-emerald-600">{reportData.avg_attendance_percentage}%</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                Compliance
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">Avg Performance Rate</p>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-black text-indigo-600">{reportData.avg_performance_rate}%</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                Score
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">Late Check-ins</p>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-black text-amber-600">{reportData.summary?.total_late || 0}</p>
              <span className="text-[11px] font-semibold text-slate-500 font-mono">
                {reportData.summary?.total_on_leave || 0} on leave
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Total Hours Logged</p>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-black text-slate-900">{reportData.summary?.total_hours_worked || 0}</p>
              <span className="text-[11px] font-semibold text-slate-500 font-mono">hrs</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TABS & PERFORMANCE FILTERS */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* TABS */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'summary' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Employee Summary & Performance
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'matrix' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Day-by-Day (1–31) Punch Matrix
          </button>
          <button
            onClick={() => setActiveTab('stored')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'stored' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Stored Reports Archive</span>
            <span className="px-1.5 py-0.2 bg-white/20 text-[10px] rounded-full">
              {storedReports.length}
            </span>
          </button>
        </div>

        {/* PERFORMANCE FILTER PILLS (FOR SUMMARY / MATRIX) */}
        {activeTab !== 'stored' && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Rating:</span>
            <button
              onClick={() => setPerformanceFilter('all')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                performanceFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({records.length})
            </button>
            <button
              onClick={() => setPerformanceFilter('outstanding')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                performanceFilter === 'outstanding' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Outstanding (95%+)
            </button>
            <button
              onClick={() => setPerformanceFilter('good')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                performanceFilter === 'good' ? 'bg-sky-600 text-white' : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
              }`}
            >
              Good (85–94%)
            </button>
            <button
              onClick={() => setPerformanceFilter('needs_attention')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                performanceFilter === 'needs_attention' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Needs Attention (&lt;75%)
            </button>
          </div>
        )}
      </div>

      {/* CONTENT BASED ON ACTIVE TAB */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">
            Computing monthly attendance matrix and performance ratings from database...
          </p>
        </div>
      ) : activeTab === 'summary' ? (
        /* TAB 1: SUMMARY TABLE WITH PERFORMANCE RATE */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-700">
              Showing {filteredRecords.length} of {records.length} Employees for {reportData?.month_name}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Click &apos;View Calendar&apos; on any employee for daily punch audit
            </span>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 font-medium">
              No employee records match the selected month and filter criteria.
            </div>
          ) : (
            <TablePrimitive
              headers={[
                'Employee Name & Code',
                'Department',
                'Performance Rate',
                'Attendance %',
                'Present / On-Time',
                'Late Arrivals',
                'Absences & Leaves',
                'Total Hours',
                'Action',
              ]}
              rows={filteredRecords.map((r: any) => [
                <div key={r.employee_id} className="flex flex-col">
                  <span className="font-extrabold text-xs text-slate-900">{r.name}</span>
                  <span className="font-mono text-[10px] text-indigo-600 font-bold">{r.employee_code}</span>
                  <span className="text-[10px] text-slate-400">{r.designation}</span>
                </div>,
                <span key="dept" className="text-xs font-semibold text-slate-700">{r.department}</span>,
                <div key="perf">
                  {getPerformanceBadge(r.performance_rating, r.performance_rate)}
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                    Punctuality: {r.punctuality_rate}%
                  </span>
                </div>,
                <div key="att" className="w-28 space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-700">
                    <span>{r.attendance_percentage}%</span>
                    <span className="text-[10px] text-slate-400">{r.present_days}/{r.working_days}d</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        r.attendance_percentage >= 90
                          ? 'bg-emerald-500'
                          : r.attendance_percentage >= 75
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${r.attendance_percentage}%` }}
                    />
                  </div>
                </div>,
                <div key="pres" className="text-xs">
                  <span className="font-bold text-emerald-700">{r.present_days} Days</span>
                  <span className="text-[10px] text-slate-400 block">({r.on_time_days} on-time)</span>
                </div>,
                <span key="late" className={`font-mono text-xs font-bold ${r.late_days > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                  {r.late_days} Late
                </span>,
                <div key="abs" className="text-xs space-y-0.5">
                  <span className={`font-mono font-bold block ${r.absent_days > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    {r.absent_days} Absent
                  </span>
                  <span className="text-[10px] text-sky-700 font-semibold block">
                    {r.leave_days} On Leave
                  </span>
                </div>,
                <div key="hrs" className="text-xs font-mono font-bold text-slate-800">
                  <span>{r.total_hours} hrs</span>
                  <span className="text-[10px] text-slate-400 block font-normal">~{r.avg_daily_hours}h / day</span>
                </div>,
                <button
                  key="act"
                  onClick={() => setDrilldownEmployee(r)}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 active:scale-95 text-xs font-bold rounded-lg border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Calendar</span>
                </button>,
              ])}
            />
          )}
        </div>
      ) : activeTab === 'matrix' ? (
        /* TAB 2: DAY-BY-DAY (1..31) ATTENDANCE PUNCH MATRIX */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-extrabold text-slate-700">
              Daily Attendance Grid: Days 1 to {reportData?.days_in_month} of {reportData?.month_name}
            </span>
            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" /> Present (P)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /> Late (L)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-rose-100 border border-rose-300" /> Absent (A)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-sky-100 border border-sky-300" /> Leave (OL)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200" /> Weekend (WO)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto max-w-full">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold">
                  <th className="p-3 sticky left-0 bg-slate-50 z-10 min-w-[200px] border-r border-slate-200">
                    Employee Details
                  </th>
                  <th className="p-2 text-center min-w-[70px] border-r border-slate-200 bg-indigo-50/50 text-indigo-900">
                    Perf. Rate
                  </th>
                  {(reportData?.calendar_days || []).map((d: any) => (
                    <th
                      key={d.day}
                      className={`p-1.5 text-center min-w-[32px] border-r border-slate-200 ${
                        d.is_weekend ? 'bg-slate-100 text-slate-400' : 'text-slate-700'
                      }`}
                      title={`${d.date} (${d.day_name})`}
                    >
                      <div className="text-[11px] font-black">{d.day}</div>
                      <div className="text-[9px] font-medium uppercase tracking-tighter opacity-75">{d.day_name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((r: any, rIdx: number) => {
                  const punchesMap = (r.daily_punches || []).reduce((acc: any, curr: any) => {
                    acc[curr.day] = curr;
                    return acc;
                  }, {});

                  return (
                    <tr key={r.employee_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 sticky left-0 bg-white z-10 border-r border-slate-200 shadow-xs">
                        <div
                          onClick={() => setDrilldownEmployee(r)}
                          className="cursor-pointer group flex flex-col"
                        >
                          <span className="font-extrabold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {r.name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {r.employee_code} • {r.department}
                          </span>
                        </div>
                      </td>

                      <td className="p-2 text-center border-r border-slate-200 bg-indigo-50/30">
                        <span className="font-mono font-black text-xs text-indigo-700">
                          {r.performance_rate}%
                        </span>
                      </td>

                      {(reportData?.calendar_days || []).map((d: any) => {
                        const punch = punchesMap[d.day];
                        const status = punch ? punch.status : (d.is_weekend ? 'week_off' : 'upcoming');
                        const tooltip = punch
                          ? `${d.date} (${d.day_name}): ${punch.status.toUpperCase()}${punch.check_in ? ` | In: ${punch.check_in}` : ''}${punch.check_out ? ` | Out: ${punch.check_out}` : ''} | ${punch.notes || ''}`
                          : `${d.date}`;

                        return (
                          <td
                            key={d.day}
                            className={`p-1 text-center border-r border-slate-100 ${d.is_weekend ? 'bg-slate-50/60' : ''}`}
                            title={tooltip}
                          >
                            <div className="flex justify-center">
                              {getStatusBadge(status)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB 3: STORED REPORTS ARCHIVE */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Stored Monthly Attendance Snapshots ({storedReports.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Saved snapshots stored in the database. Load any snapshot to inspect historic verified attendance and performance records.
              </p>
            </div>
          </div>

          {storedReports.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 font-medium space-y-2">
              <p>No monthly reports stored yet in the database.</p>
              <p className="text-[11px] text-slate-500">
                Click &apos;Store / Save Monthly Report&apos; to archive the current month&apos;s verified attendance.
              </p>
            </div>
          ) : (
            <TablePrimitive
              headers={[
                'Report Title & Month',
                'Department Scope',
                'Employees',
                'Avg Attendance',
                'Avg Performance',
                'Archived Date & Stored By',
                'Action',
              ]}
              rows={storedReports.map((sr: any) => [
                <div key={sr.id} className="flex flex-col">
                  <span className="font-extrabold text-xs text-slate-900">{sr.title}</span>
                  <span className="font-mono text-[10px] text-indigo-600 font-bold">{sr.month_name} ({sr.month})</span>
                </div>,
                <span key="dept" className="text-xs font-semibold text-slate-700 capitalize">
                  {sr.department || 'All'}
                </span>,
                <span key="emp" className="text-xs font-mono font-bold text-slate-900">{sr.total_employees} Staff</span>,
                <span key="att" className="text-xs font-bold text-emerald-700">{sr.avg_attendance_percentage}%</span>,
                <span key="perf" className="text-xs font-bold text-indigo-700">{sr.avg_performance_rate}%</span>,
                <div key="date" className="text-xs">
                  <span className="text-slate-700 font-medium">
                    {new Date(sr.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    By {sr.creator?.name || 'Administrator'}
                  </span>
                </div>,
                <div key="acts" className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleLoadStoredSnapshot(sr.id)}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 active:scale-95 text-xs font-bold rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                  >
                    Load Snapshot
                  </button>
                  <button
                    onClick={() => handleDeleteStoredSnapshot(sr.id, sr.title)}
                    className="p-1 text-slate-400 hover:text-rose-600 active:scale-95 transition-colors cursor-pointer"
                    title="Delete snapshot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>,
              ])}
            />
          )}
        </div>
      )}

      {/* MODAL: STORE MONTHLY REPORT */}
      <Modal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        title="Store & Archive Monthly Attendance Report"
      >
        <form onSubmit={handleStoreReport} className="space-y-4">
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs space-y-1">
            <p className="font-extrabold text-indigo-900">
              Snapshot for {reportData?.month_name} ({selectedMonth})
            </p>
            <p className="text-indigo-700 font-medium">
              This will permanently archive the calculated attendance statistics, performance rates, and daily punch matrix for all {reportData?.total_employees} employees into the database.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Report Title</label>
            <input
              type="text"
              required
              value={storeTitle}
              onChange={(e) => setStoreTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Administrative Notes</label>
            <textarea
              rows={3}
              value={storeNotes}
              onChange={(e) => setStoreNotes(e.target.value)}
              placeholder="e.g. Approved and locked for payroll processing..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsStoreModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={storing}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {storing ? 'Storing...' : 'Confirm & Save in Database'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EMPLOYEE MONTHLY CALENDAR DRILLDOWN */}
      <Modal
        isOpen={!!drilldownEmployee}
        onClose={() => setDrilldownEmployee(null)}
        title={`Monthly Punch Calendar: ${drilldownEmployee?.name || ''}`}
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-extrabold text-slate-900 text-sm">{drilldownEmployee?.name}</p>
              <p className="text-slate-500 font-mono">
                {drilldownEmployee?.employee_code} • {drilldownEmployee?.department} • {drilldownEmployee?.designation}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Performance Rate</span>
                <span className="font-mono font-black text-sm text-indigo-600">
                  {drilldownEmployee?.performance_rate}%
                </span>
              </div>
              <div className="text-right pl-3 border-l border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Attendance Rate</span>
                <span className="font-mono font-black text-sm text-emerald-600">
                  {drilldownEmployee?.attendance_percentage}%
                </span>
              </div>
            </div>
          </div>

          <div className="max-h-[55vh] overflow-y-auto">
            <TablePrimitive
              headers={['Date & Day', 'Status', 'Check In', 'Check Out', 'Hours Logged', 'Notes']}
              rows={(drilldownEmployee?.daily_punches || []).map((dp: any) => [
                <div key={dp.date}>
                  <span className="font-mono font-bold text-xs text-slate-900">{dp.date}</span>
                  <span className="text-[10px] text-slate-400 block font-semibold">{dp.day_name}</span>
                </div>,
                <div key="st">{getStatusBadge(dp.status)}</div>,
                <span key="in" className="font-mono text-xs text-slate-700">
                  {dp.check_in || '--:--'}
                </span>,
                <span key="out" className="font-mono text-xs text-slate-700">
                  {dp.check_out || '--:--'}
                </span>,
                <span key="hrs" className="font-mono font-bold text-xs text-slate-800">
                  {dp.hours_worked > 0 ? `${dp.hours_worked}h` : '-'}
                </span>,
                <span key="nt" className="text-xs text-slate-600 italic">
                  {dp.notes || 'None'}
                </span>,
              ])}
            />
          </div>
        </div>
      </Modal>

      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
    </div>
  );
}
