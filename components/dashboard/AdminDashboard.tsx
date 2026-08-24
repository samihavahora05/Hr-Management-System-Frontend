'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import {
  Users,
  CalendarDays,
  UserCheck,
  CreditCard,
  Settings,
  TrendingUp,
  FileText,
  ListTodo,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Building2,
  ChevronRight,
  Sparkles,
  Plus,
} from '@/components/ui/Icon';

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/admin/stats')
      .then((res) => setStats(res))
      .catch((err) => {
        console.error('Failed to load admin stats, falling back to /dashboard/stats', err);
        return fetchApi('/dashboard/stats').then((res) => setStats(res));
      })
      .finally(() => setLoading(false));
  }, []);

  const headcount = stats?.headcount || {
    total: stats?.counts?.total_employees || 0,
    active: stats?.counts?.total_employees || 0,
    departments: 4,
    managers: stats?.counts?.total_managers || 0,
    team_leaders: stats?.counts?.total_team_leaders || 0,
  };
  const attendance = stats?.attendance || {
    today_present: 0,
    today_late: 0,
    on_time_rate: 100,
  };
  const pending = stats?.pending_actions || {
    leave_requests: 0,
    expense_claims: 0,
    total_pending: 0,
  };
  const recruitment = stats?.recruitment || {
    active_openings: 0,
    active_candidates: 0,
  };
  const recentActivity = stats?.recent_activity || [];

  return (
    <div className="space-y-6 text-slate-900 animate-in fade-in duration-200">
      {/* COMMAND CENTER TOP BANNER */}
      <div className="bg-gradient-to-r from-[#0f365e] to-[#1e548a] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold tracking-wider uppercase">
              Command Center
            </span>
            <span className="text-xs text-indigo-100 font-medium">
              {stats?.organization?.name || 'Organization Headquarters'}
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight">Organization Overview & Operations</h2>
          <p className="text-xs text-indigo-100 mt-1 max-w-xl">
            Real-time workforce intelligence, pending approvals, attendance compliance, and AI-assisted governance.
          </p>
        </div>

        <Link
          href="/admin/assistant"
          className="px-4 py-2.5 bg-white text-[#0f365e] hover:bg-slate-100 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer shrink-0 active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Launch AI Assistant</span>
        </Link>
      </div>

      {/* 4 PRIMARY METRIC TILES ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/users"
          className="group bg-white border border-slate-200 hover:border-slate-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-5 shadow-2xs block cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">
            <span className="group-hover:text-slate-900 transition-colors">Total Workforce</span>
            <Users className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div className="text-3xl font-black text-slate-900 font-mono">
              {headcount.total}
            </div>
            <span className="text-[11px] font-bold text-emerald-600">
              {headcount.active} Active
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">
            Across {headcount.departments} departments
          </p>
        </Link>

        <Link
          href="/admin/attendance"
          className="group bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-5 shadow-2xs block cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">
            <span className="group-hover:text-emerald-700 transition-colors">Today Attendance</span>
            <Clock className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div className="text-3xl font-black text-emerald-700 font-mono">
              {attendance.today_present}
            </div>
            <span className="text-[11px] font-bold text-slate-600 font-mono">
              {attendance.on_time_rate}% On-Time
            </span>
          </div>
          <p className="text-[10px] text-amber-600 mt-2 font-medium">
            {attendance.today_late} late arrivals today
          </p>
        </Link>

        <Link
          href="/admin/leave"
          className="group bg-white border border-slate-200 hover:border-amber-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-5 shadow-2xs block cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">
            <span className="group-hover:text-amber-700 transition-colors">Pending Approvals</span>
            <AlertTriangle className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div className="text-3xl font-black text-amber-600 font-mono">
              {pending.total_pending}
            </div>
            <ChevronRight className="w-4 h-4 text-amber-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">
            {pending.leave_requests} leaves, {pending.expense_claims} claims
          </p>
        </Link>

        <Link
          href="/hr/recruitment"
          className="group bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-5 shadow-2xs block cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">
            <span className="group-hover:text-indigo-700 transition-colors">Recruitment ATS</span>
            <UserCheck className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div className="text-3xl font-black text-indigo-700 font-mono">
              {recruitment.active_openings}
            </div>
            <span className="text-[11px] font-bold text-indigo-600">
              {recruitment.active_candidates} In Pipeline
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">
            Active Job Openings
          </p>
        </Link>
      </div>

      {/* QUICK ACTIONS & RECENT ACTIVITY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QUICK ACTIONS PANEL */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-1">Administrative Shortcuts</h3>
            <p className="text-xs text-slate-500 mb-4">Direct shortcuts to governance facilities</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <Link
                href="/admin/assistant"
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>AI Assistant</span>
              </Link>
              <Link
                href="/admin/users"
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4 text-slate-700 shrink-0" />
                <span>User Roles</span>
              </Link>
              <Link
                href="/admin/departments"
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-slate-700 shrink-0" />
                <span>Departments</span>
              </Link>
              <Link
                href="/admin/audit-logs"
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-700 shrink-0" />
                <span>Audit Trail</span>
              </Link>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-semibold">System Status: Optimal</span>
            <Link href="/admin/settings" className="text-xs font-extrabold text-[#0f365e] hover:underline flex items-center gap-1">
              <span>Settings</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* RECENT ORGANIZATION ACTIVITY LOG */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Recent Organization Activity</h3>
              <p className="text-xs text-slate-500">Live immutable audit trail of system events</p>
            </div>
            <Link
              href="/admin/audit-logs"
              className="text-xs font-bold text-[#0f365e] hover:underline flex items-center gap-1"
            >
              <span>View All Logs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-medium">
              No recent audit records available.
            </div>
          ) : (
            <div className="space-y-2.5 text-xs">
              {recentActivity.map((log: any) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 font-extrabold text-[11px] flex items-center justify-center">
                      {(log.actor?.name || 'S')[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 capitalize">
                        {String(log.action).replace(/_/g, ' ')}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        by <span className="font-semibold text-slate-700">{log.actor?.name || 'System Admin'}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {log.created_at ? String(log.created_at).slice(0, 16).replace('T', ' ') : 'Recent'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
