'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Search,
  ChevronRight,
  Filter,
  Calendar,
  Send,
  RefreshCw,
  FileCheck,
} from '@/components/ui/Icon';

interface EmployeeTaskPerformanceProps {
  portalScope?: 'hr' | 'manager' | 'team_leader' | 'admin';
}

export function EmployeeTaskPerformance({ portalScope = 'hr' }: EmployeeTaskPerformanceProps) {
  const [performances, setPerformances] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    overall_completion_rate: 0,
    overall_performance_rate: 0,
    total_organization_tasks: 0,
    total_completed_tasks: 0,
    total_approved_tasks: 0,
    total_earned_marks: 0,
    total_possible_marks: 0,
    total_employees: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadPerformanceData();
  }, [startDate, endDate]);

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      let queryStr = '';
      const params: string[] = [];
      if (startDate) params.push(`start_date=${startDate}`);
      if (endDate) params.push(`end_date=${endDate}`);
      if (params.length > 0) queryStr = `?${params.join('&')}`;

      const res = await fetchApi(`/tasks/performance${queryStr}`);
      setPerformances(res.performances || []);
      if (res.summary) setSummary(res.summary);
    } catch (err) {
      console.error('Failed to fetch task performance data', err);
    } finally {
      setLoading(false);
    }
  };

  const departments = Array.from(new Set(performances.map((p) => p.department))).filter(Boolean);

  const filteredPerformances = performances.filter((p) => {
    if (departmentFilter !== 'all' && (p.department || '').toLowerCase() !== departmentFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchCode = (p.employee_code || '').toLowerCase().includes(q);
      const matchDept = (p.department || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchDept) return false;
    }
    return true;
  });

  const topPerformer =
    performances.find((p) => (p.total_tasks || 0) > 0 && (p.approved_tasks || p.completed_tasks || 0) > 0) ||
    performances.find((p) => (p.total_tasks || 0) > 0) ||
    (performances.length > 0 ? performances[0] : null);

  return (
    <div className="space-y-6">
      {/* SUMMARY STATS & LEADERBOARD HIGHLIGHT */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* OVERALL PERFORMANCE SCORE */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Overall Performance Score</span>
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {summary.overall_performance_rate ?? summary.overall_completion_rate}%
            </span>
            <span className="text-xs text-slate-500 font-semibold">from admin marks</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${summary.overall_performance_rate ?? summary.overall_completion_rate}%` }}
            />
          </div>
        </div>

        {/* TOP PERFORMER CARD */}
        <div className="bg-white p-5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-bold uppercase tracking-wider">Top Task Performer</span>
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          {topPerformer && topPerformer.total_tasks > 0 ? (
            <div>
              <p className="font-extrabold text-slate-900 text-sm truncate">{topPerformer.name}</p>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {topPerformer.department} — {topPerformer.performance_percentage}% Verified Score ({topPerformer.total_earned_marks}/{topPerformer.total_possible_marks} marks)
              </p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                🏆 #{1} Performance Leader
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-medium">No task evaluation records yet</p>
          )}
        </div>

        {/* TOTAL MARKS EARNED */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold uppercase tracking-wider">Marks Awarded</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {(summary.total_earned_marks || 0).toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              of {(summary.total_possible_marks || 0).toLocaleString()} max marks
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {summary.total_approved_tasks || summary.total_completed_tasks || 0} approved tasks verified by admin
          </p>
        </div>

        {/* ACTIVE EMPLOYEES EVALUATED */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Workforce Evaluated</span>
            <Users className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-3xl font-black text-slate-900 font-mono">
            {summary.total_employees}
          </span>
          <p className="text-[11px] text-slate-500 font-medium">
            Strict manual review across all departments
          </p>
        </div>
      </div>

      {/* SEARCH & FILTERS CONTROLS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search employee name, employee code, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0f365e]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:outline-hidden"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px]"
              title="From date"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px]"
              title="To date"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline font-medium"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PERFORMANCE TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs font-semibold text-slate-400 animate-pulse">
            Calculating employee task performance scores from verified admin marks...
          </div>
        ) : filteredPerformances.length === 0 ? (
          <div className="py-12 text-center text-xs font-semibold text-slate-500">
            No employee performance records found matching filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Department & Role</th>
                  <th className="py-3.5 px-4 text-center">Total Tasks</th>
                  <th className="py-3.5 px-4 text-center">Approved / Pending / Revision</th>
                  <th className="py-3.5 px-4 text-center">Overdue</th>
                  <th className="py-3.5 px-4 text-center">Marks Earned / Max</th>
                  <th className="py-3.5 px-4">Performance Score (%)</th>
                  <th className="py-3.5 px-4 text-center">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPerformances.map((emp, index) => {
                  const rate = emp.performance_percentage ?? 0;

                  let progressColor = 'bg-rose-500';
                  if (rate >= 75) progressColor = 'bg-emerald-500';
                  else if (rate >= 50) progressColor = 'bg-sky-500';

                  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (emp.rating_badge === 'emerald') {
                    badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200 font-extrabold';
                  } else if (emp.rating_badge === 'blue') {
                    badgeStyle = 'bg-sky-100 text-sky-800 border-sky-200 font-bold';
                  } else if (emp.rating_badge === 'amber') {
                    badgeStyle = 'bg-amber-100 text-amber-800 border-amber-200 font-semibold';
                  } else if (emp.rating_badge === 'rose') {
                    badgeStyle = 'bg-rose-100 text-rose-800 border-rose-200 font-bold';
                  }

                  return (
                    <tr key={emp.employee_id} className="hover:bg-slate-50/80 transition-colors">
                      {/* EMPLOYEE INFO */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0f365e] text-white font-black text-xs flex items-center justify-center shadow-2xs">
                            {(emp.name || 'E')[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-extrabold text-slate-900 text-xs">{emp.name}</p>
                              {index === 0 && emp.total_tasks > 0 && emp.total_earned_marks > 0 && (
                                <span className="text-[11px]" title="Leader">
                                  👑
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-mono text-slate-400">
                              {emp.employee_code || `EMP-${emp.employee_id}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* DEPT & DESIGNATION */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-bold text-slate-800 text-xs">{emp.department}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{emp.designation || emp.role}</p>
                      </td>

                      {/* TOTAL TASKS */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono font-extrabold text-slate-900 text-sm">
                        {emp.total_tasks}
                      </td>

                      {/* APPROVED vs PENDING REVIEW vs REVISION */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-[11px]">
                            {emp.approved_tasks || emp.completed_tasks || 0} Approved
                          </span>
                          {(emp.submitted_for_review_tasks || 0) > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-700 font-bold text-[11px]">
                              {emp.submitted_for_review_tasks} Review
                            </span>
                          )}
                          {(emp.needs_revision_tasks || 0) > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[11px]">
                              {emp.needs_revision_tasks} Revision
                            </span>
                          )}
                          {(emp.in_progress_tasks || 0) > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[11px]">
                              {emp.in_progress_tasks} Active
                            </span>
                          )}
                        </div>
                      </td>

                      {/* OVERDUE */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {emp.overdue_tasks > 0 ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 border border-rose-200 text-rose-700 font-extrabold text-[11px] inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            {emp.overdue_tasks}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-mono">0</span>
                        )}
                      </td>

                      {/* MARKS EARNED / MAX */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono">
                        <span className="font-extrabold text-slate-900 text-xs">
                          {emp.total_earned_marks || 0}
                        </span>
                        <span className="text-slate-400 text-xs"> / {emp.total_possible_marks || 0}</span>
                      </td>

                      {/* PERFORMANCE SCORE BAR */}
                      <td className="py-3.5 px-4 whitespace-nowrap min-w-[160px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono font-extrabold text-slate-800">
                            <span>Score</span>
                            <span>{rate}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${progressColor} transition-all duration-300`}
                              style={{ width: `${Math.min(100, rate)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* RATING BADGE */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] border ${badgeStyle}`}>
                          {emp.rating}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
