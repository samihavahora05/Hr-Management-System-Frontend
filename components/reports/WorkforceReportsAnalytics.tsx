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
import { Download, Users, Building2, CalendarDays, Search, Eye, Filter, CheckCircle2, Clock, ChevronRight } from '@/components/ui/Icon';
import { MonthlyAttendanceReportView } from '@/components/reports/MonthlyAttendanceReportView';

interface WorkforceReportsAnalyticsProps {
  portalNamespace?: 'admin' | 'hr' | 'manager';
}

export function WorkforceReportsAnalytics({ portalNamespace = 'hr' }: WorkforceReportsAnalyticsProps) {
  const [headcount, setHeadcount] = useState<any>(null);
  const [leaveUsage, setLeaveUsage] = useState<any[]>([]);
  const [attendanceTrends, setAttendanceTrends] = useState<any[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters & State
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [usageFilter, setUsageFilter] = useState<'all' | 'active' | 'unused'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'leave' | 'attendance' | 'monthly_attendance'>('overview');

  // Interactive Modals
  const [drilldownCategory, setDrilldownCategory] = useState<any | null>(null);
  const [selectedDeptModal, setSelectedDeptModal] = useState<string | null>(null);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    setLoading(true);
    try {
      const [hcRes, luRes, attRes, empRes] = await Promise.all([
        fetchApi('/reports/headcount').catch(() => null),
        fetchApi('/reports/leave-usage').catch(() => ({ usage: [] })),
        fetchApi('/reports/attendance-trends').catch(() => ({ trends: [] })),
        fetchApi('/employees?all=true').catch(() => ({ employees: [] })),
      ]);

      const defaultCategories = [
        { leave_type: 'Casual Leave', code: 'CL', max_days_per_year: 12, total_days_taken: 1, requests: [] },
        { leave_type: 'Sick Leave', code: 'SL', max_days_per_year: 10, total_days_taken: 0, requests: [] },
        { leave_type: 'Earned Leave', code: 'EL', max_days_per_year: 15, total_days_taken: 0, requests: [] },
        { leave_type: 'Maternity Leave', code: 'ML', max_days_per_year: 84, total_days_taken: 0, requests: [] },
      ];

      setHeadcount(hcRes);
      setLeaveUsage(luRes && luRes.usage && luRes.usage.length > 0 ? luRes.usage : defaultCategories);
      setAttendanceTrends(attRes ? attRes.trends || [] : []);
      setAllEmployees(empRes ? empRes.employees || [] : []);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to load report analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (leaveUsage.length === 0) {
      setToastMessage('No report data available to export.');
      return;
    }
    const headers = ['Leave Category', 'Category Code', 'Annual Max Limit', 'Total Days Taken', 'Approved Requests Count'];
    const rows = leaveUsage.map((u) => [
      u.leave_type,
      u.code || 'N/A',
      `${u.max_days_per_year} Days`,
      `${u.total_days_taken} Days`,
      `${(u.requests || []).length} Requests`,
    ]);
    exportToCSV(`${portalNamespace.toUpperCase()}_Workforce_Reports`, headers, rows);
    setToastMessage('Workforce analytics exported to CSV successfully!');
  };

  const totalHeadcount = headcount?.summary?.total_headcount || allEmployees.length || 0;
  const activeEmployees = headcount?.summary?.active_employees || allEmployees.filter((e) => e.status === 'active').length || 0;

  // Fallback department grouping if backend rawDepts is empty
  let rawDepts = headcount?.by_department || [];
  if (rawDepts.length === 0 && allEmployees.length > 0) {
    const deptMap: Record<string, number> = {};
    allEmployees.forEach((e) => {
      const dept = e.department || 'General';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    rawDepts = Object.keys(deptMap).map((dept) => ({
      department: dept,
      count: deptMap[dept],
    }));
  }

  // Department filter list
  const departmentsList = Array.from(new Set(rawDepts.map((d: any) => d.department))).filter(Boolean);

  const filteredLeaveUsage = leaveUsage.map((u) => {
    let requests = u.requests || [];
    if (selectedDept !== 'all') {
      requests = requests.filter((r: any) => (r.department || '').toLowerCase() === selectedDept.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchType = u.leave_type.toLowerCase().includes(q);
      const matchCode = (u.code || '').toLowerCase().includes(q);
      if (!matchType && !matchCode) return null;
    }
    const daysTaken = selectedDept !== 'all'
      ? requests.reduce((acc: number, curr: any) => acc + (parseFloat(curr.days_count) || 0), 0)
      : u.total_days_taken;

    if (usageFilter === 'active' && daysTaken <= 0) return null;
    if (usageFilter === 'unused' && daysTaken > 0) return null;

    return {
      ...u,
      requests,
      filtered_days_taken: daysTaken,
    };
  }).filter(Boolean) as any[];

  const filteredDepts = rawDepts.filter((d: any) => {
    if (selectedDept !== 'all' && (d.department || '').toLowerCase() !== selectedDept.toLowerCase()) {
      return false;
    }
    return true;
  });

  const deptEmployees = selectedDeptModal
    ? allEmployees.filter((e) => (e.department || '').toLowerCase() === selectedDeptModal.toLowerCase())
    : [];

  const titlePrefix = portalNamespace === 'admin' ? 'Organization' : portalNamespace === 'manager' ? 'Team & Organization' : 'HR';

  return (
    <PortalLayout namespace={portalNamespace}>
      <PageHeader
        title={`${titlePrefix} Reports & Workforce Analytics`}
        description="Interactive headcount reports, department distribution, attendance trends, and leave utilization drilldown"
        action={
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Analytics CSV</span>
          </button>
        }
      />

      {loading ? (
        <div className="py-16 text-center text-xs font-bold text-slate-400 animate-pulse">
          Generating interactive workforce analytics & headcount metrics from database...
        </div>
      ) : (
        <div className="space-y-6">
          {/* TOP KPI CARDS (CLICKABLE / INTERACTIVE) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div
              onClick={() => setSelectedDept('all')}
              className={`p-4 sm:p-5 rounded-xl border transition-all cursor-pointer shadow-2xs space-y-1 min-w-0 ${
                selectedDept === 'all' ? 'bg-[#0f365e] text-white border-[#0f365e]' : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between opacity-80">
                <span className="text-[10px] font-extrabold uppercase tracking-wider truncate">Total Headcount</span>
                <Users className="w-4 h-4 shrink-0" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold">{totalHeadcount}</p>
              <p className="text-[10px] sm:text-[11px] opacity-75 font-medium truncate">Click to reset dept filter</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1 min-w-0">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-extrabold uppercase tracking-wider truncate">Active Workforce</span>
                <Users className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{activeEmployees}</p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Active portal status</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1 min-w-0">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-extrabold uppercase tracking-wider truncate">Departments</span>
                <Building2 className="w-4 h-4 text-[#0f365e] shrink-0" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#0f365e]">{rawDepts.length}</p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Operational units</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1 min-w-0">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-extrabold uppercase tracking-wider truncate">Leave Categories</span>
                <CalendarDays className="w-4 h-4 text-amber-600 shrink-0" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-600">{leaveUsage.length}</p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Configured policies</p>
            </div>
          </div>

          {/* INTERACTIVE CONTROLS: TABS, SEARCH, & DEPT FILTER */}
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            {/* TABS */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto max-w-full">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'overview' ? 'bg-[#0f365e] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Workforce Distribution
              </button>
              <button
                onClick={() => setActiveTab('leave')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'leave' ? 'bg-[#0f365e] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Leave Utilization
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'attendance' ? 'bg-[#0f365e] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Attendance Log Trends
              </button>
              {portalNamespace === 'admin' && (
                <button
                  onClick={() => setActiveTab('monthly_attendance')}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'monthly_attendance' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Monthly Attendance Register</span>
                  <span className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded bg-white/20">Admin</span>
                </button>
              )}
            </div>

            {/* FILTERS */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0f365e]"
                />
              </div>

              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer focus:bg-white focus:outline-hidden"
              >
                <option value="all">All Departments</option>
                {departmentsList.map((d: any) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* TAB 1: WORKFORCE & DEPARTMENT DISTRIBUTION */}
          {activeTab === 'overview' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#0f365e]" />
                    <span>Department Headcount Distribution</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Click any department card to view department staff roster</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredDepts.map((d: any, idx: number) => {
                  const pct = totalHeadcount > 0 ? Math.round((d.count / totalHeadcount) * 100) : 0;
                  const isSelected = selectedDept.toLowerCase() === (d.department || '').toLowerCase();

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDeptModal(d.department || 'General')}
                      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 group ${
                        isSelected ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-500/20' : 'bg-slate-50 border-slate-200 hover:border-[#0f365e]'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-slate-900 group-hover:text-[#0f365e] flex items-center gap-1">
                          <span>{d.department || 'General'}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                        <span className="font-mono text-slate-600 font-bold">{d.count} Staff ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#0f365e] rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: LEAVE UTILIZATION WITH VISUAL BARS & CLICKABLE DRILLDOWN */}
          {(activeTab === 'leave' || activeTab === 'overview') && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4 overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-[#0f365e]" />
                    <span>Leave Utilization by Category</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Click any row to open the employee request history drilldown</p>
                </div>

                {/* FILTER PILLS */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setUsageFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      usageFilter === 'all' ? 'bg-[#0f365e] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Policies
                  </button>
                  <button
                    onClick={() => setUsageFilter('active')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      usageFilter === 'active' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    With Active Usage
                  </button>
                  <button
                    onClick={() => setUsageFilter('unused')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      usageFilter === 'unused' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Unused Policies
                  </button>
                </div>
              </div>

              {filteredLeaveUsage.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-medium">No matching leave categories found.</div>
              ) : (
                <TablePrimitive
                  headers={['Leave Category', 'Code', 'Annual Max Allowance', 'Utilization Progress', 'Status & Records', 'Action']}
                  rows={filteredLeaveUsage.map((u, i) => {
                    const maxDays = u.max_days_per_year || 12;
                    const taken = u.filtered_days_taken || 0;
                    const pct = Math.min(100, Math.round((taken / maxDays) * 100));

                    return [
                      <div key={i} className="flex flex-col cursor-pointer" onClick={() => setDrilldownCategory(u)}>
                        <span className="font-extrabold text-slate-900 text-xs hover:text-[#0f365e]">{u.leave_type}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{u.code || 'LEAVE'}</span>
                      </div>,
                      <span key="code" className="font-mono text-xs text-sky-800 font-bold px-2 py-0.5 bg-sky-50 rounded border border-sky-200">{u.code || 'LEAVE'}</span>,
                      <span key="max" className="text-xs text-slate-700 font-medium">{maxDays} Days / Year</span>,
                      <div key="progress" className="w-40 space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-slate-700">
                          <span>{taken} Days Taken</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${pct > 75 ? 'bg-rose-500' : pct > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>,
                      <Badge key="status" variant={taken > 0 ? 'green' : 'blue'}>
                        {(u.requests || []).length} Approved Records
                      </Badge>,
                      <button
                        key="drill"
                        onClick={() => setDrilldownCategory(u)}
                        className="px-3 py-1 bg-sky-50 hover:bg-sky-100 active:scale-95 text-sky-800 text-xs font-bold rounded-lg border border-sky-200 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-600" />
                        <span>View History</span>
                      </button>,
                    ];
                  })}
                />
              )}
            </div>
          )}

          {/* TAB 3: ATTENDANCE TRENDS LOGS */}
          {activeTab === 'attendance' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0f365e]" />
                <span>Attendance Log Trends (Past 30 Days)</span>
              </h3>
              {attendanceTrends.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-medium">No attendance trend data recorded.</div>
              ) : (
                <div className="space-y-2">
                  {attendanceTrends.slice(0, 15).map((t, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs hover:bg-slate-100/80 transition-colors">
                      <span className="font-mono font-bold text-slate-800">{t.date}</span>
                      <span className="capitalize font-bold text-emerald-700 px-2 py-0.5 bg-emerald-50 rounded border border-emerald-200">{t.status}</span>
                      <span className="font-mono font-bold text-[#0f365e]">{t.count} Employee Logged</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MONTHLY ATTENDANCE REGISTER & ARCHIVE (ADMIN ONLY) */}
          {activeTab === 'monthly_attendance' && portalNamespace === 'admin' && (
            <MonthlyAttendanceReportView />
          )}
        </div>
      )}

      {/* INTERACTIVE LEAVE CATEGORY DRILLDOWN MODAL */}
      <Modal
        isOpen={!!drilldownCategory}
        onClose={() => setDrilldownCategory(null)}
        title={`Leave History Drilldown: ${drilldownCategory?.leave_type || ''}`}
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <p className="font-extrabold text-slate-900 text-sm">{drilldownCategory?.leave_type} ({drilldownCategory?.code})</p>
              <p className="text-slate-500 font-medium">Annual Policy Limit: {drilldownCategory?.max_days_per_year} Days</p>
            </div>
            <div className="text-right font-mono">
              <p className="text-sm font-extrabold text-[#0f365e]">{drilldownCategory?.filtered_days_taken} Total Days Taken</p>
            </div>
          </div>

          <div className="max-h-[50vh] overflow-y-auto">
            {(!drilldownCategory?.requests || drilldownCategory.requests.length === 0) ? (
              <div className="p-8 text-center text-xs text-slate-400 font-medium">
                No approved leave records found for {drilldownCategory?.leave_type} matching selected filters.
              </div>
            ) : (
              <TablePrimitive
                headers={['Employee', 'Department', 'Duration', 'Days', 'Reason & Approver']}
                rows={drilldownCategory.requests.map((r: any, idx: number) => [
                  <div key={idx}>
                    <p className="font-extrabold text-slate-900 text-xs">{r.employee_name}</p>
                    <p className="text-[10px] font-mono text-slate-400">{r.employee_code}</p>
                  </div>,
                  <span key="dept" className="text-xs text-slate-700 font-bold">{r.department || 'General'}</span>,
                  <span key="dates" className="font-mono text-[11px] text-slate-600">{r.start_date} to {r.end_date}</span>,
                  <span key="cnt" className="font-mono font-extrabold text-xs text-[#0f365e]">{r.days_count} Days</span>,
                  <div key="reason">
                    <p className="text-xs text-slate-700 italic truncate max-w-xs">&quot;{r.reason || 'Personal Leave'}&quot;</p>
                    <p className="text-[10px] text-emerald-700 font-bold">Approved by {r.approver_name}</p>
                  </div>,
                ])}
              />
            )}
          </div>
        </div>
      </Modal>

      {/* INTERACTIVE DEPARTMENT STAFF ROSTER MODAL */}
      <Modal
        isOpen={!!selectedDeptModal}
        onClose={() => setSelectedDeptModal(null)}
        title={`${selectedDeptModal || ''} Department Roster`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
            <span className="font-extrabold text-slate-800">{selectedDeptModal} Department</span>
            <span className="font-mono font-bold text-[#0f365e]">{deptEmployees.length} Total Staff</span>
          </div>

          <div className="max-h-[50vh] overflow-y-auto">
            {deptEmployees.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-medium">No employee records found in this department.</div>
            ) : (
              <TablePrimitive
                headers={['Employee', 'Employee Code', 'Designation', 'Status']}
                rows={deptEmployees.map((e: any) => [
                  <div key={e.id}>
                    <p className="font-extrabold text-slate-900 text-xs">{e.name}</p>
                    <p className="text-[10px] font-mono text-slate-400">{e.email}</p>
                  </div>,
                  <span key="code" className="font-mono text-xs text-[#0f365e] font-bold">{e.employee_code || `EMP00${e.id}`}</span>,
                  <span key="des" className="text-xs text-slate-700">{e.designation || 'Staff'}</span>,
                  <Badge key="st" variant={e.status === 'active' ? 'green' : 'red'}>
                    {e.status}
                  </Badge>,
                ])}
              />
            )}
          </div>
        </div>
      </Modal>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
