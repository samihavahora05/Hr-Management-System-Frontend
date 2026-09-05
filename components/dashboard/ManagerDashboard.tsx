'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import {
  Users,
  UserCheck,
  ListTodo,
  CheckCircle2,
  TrendingUp,
  Plus,
  ChevronRight,
  ShieldCheck,
} from '@/components/ui/Icon';

export function ManagerDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/dashboard/stats')
      .then((res) => setStats(res))
      .catch((err) => console.error('Failed to load manager stats', err))
      .finally(() => setLoading(false));
  }, []);

  const counts = stats?.counts || {};
  const tasks = stats?.tasks || {};
  const recentTasks = stats?.recent_tasks || [];

  return (
    <div className="space-y-6 text-slate-900">
      {/* 4 KPI CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/manager/team"
          className="group bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-4 sm:p-5 shadow-2xs block cursor-pointer min-w-0"
        >
          <div className="flex items-center justify-between text-slate-500 uppercase tracking-wider text-[10px] font-bold">
            <span className="group-hover:text-slate-900 transition-colors truncate">My Team Leaders</span>
            <Users className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
          </div>
          <div className="flex items-baseline justify-between mt-2 flex-wrap gap-1">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {counts.total_team_leaders || 0}
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        </Link>

        <Link
          href="/manager/team"
          className="group bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-4 sm:p-5 shadow-2xs block cursor-pointer min-w-0"
        >
          <div className="flex items-center justify-between text-slate-500 uppercase tracking-wider text-[10px] font-bold">
            <span className="group-hover:text-slate-900 transition-colors truncate">My Team Employees</span>
            <UserCheck className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
          </div>
          <div className="flex items-baseline justify-between mt-2 flex-wrap gap-1">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {counts.total_employees || 0}
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        </Link>

        <Link
          href="/manager/tasks"
          className="group bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-4 sm:p-5 shadow-2xs block cursor-pointer min-w-0"
        >
          <div className="flex items-center justify-between text-slate-500 uppercase tracking-wider text-[10px] font-bold">
            <span className="group-hover:text-indigo-600 transition-colors truncate">Manager Tasks</span>
            <ListTodo className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform shrink-0" />
          </div>
          <div className="flex items-baseline justify-between mt-2 flex-wrap gap-1">
            <div className="text-2xl sm:text-3xl font-black text-indigo-700 font-mono">
              {tasks.total || 0}
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        </Link>

        <Link
          href="/manager/tasks"
          className="group bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-4 sm:p-5 shadow-2xs block cursor-pointer min-w-0"
        >
          <div className="flex items-center justify-between text-slate-500 uppercase tracking-wider text-[10px] font-bold">
            <span className="group-hover:text-sky-600 transition-colors truncate">Team Rate</span>
            <TrendingUp className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform shrink-0" />
          </div>
          <div className="flex items-baseline justify-between mt-2 flex-wrap gap-1">
            <div className="text-2xl sm:text-3xl font-black text-sky-700 font-mono">
              {tasks.completion_rate || 0}%
            </div>
            <ChevronRight className="w-4 h-4 text-sky-300 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        </Link>
      </div>

      {/* RECENT MANAGER TASKS & ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Recent Manager & Team Leader Tasks
            </h3>
            <Link href="/manager/tasks" className="text-xs font-bold text-[#0f365e] hover:underline">
              View All Tasks &rarr;
            </Link>
          </div>

          {recentTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-medium">
              No tasks assigned under your company management structure.
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((t: any) => (
                <div key={t.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-900 truncate">{t.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Assigned by <strong className="capitalize">{t.assigned_by_role}</strong> to <strong className="capitalize">{t.assigned_to_role}</strong> ({t.assignedTo?.name || 'User'})
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize bg-white text-slate-700 shrink-0 self-start sm:self-center">
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Manager Control Actions
          </h3>

          <div className="space-y-3 text-xs font-bold">
            <Link
              href="/manager/tasks"
              className="p-3.5 bg-[#0f365e] text-white hover:bg-[#164677] rounded-xl flex items-center gap-2 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Task to Team Leader</span>
            </Link>

            <Link
              href="/manager/tasks"
              className="p-3.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl flex items-center gap-3 transition-colors text-slate-800"
            >
              <ListTodo className="w-4 h-4 text-[#0f365e]" />
              <span>Review Team Task Board</span>
            </Link>

            <Link
              href="/manager/team"
              className="p-3.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl flex items-center gap-3 transition-colors text-slate-800"
            >
              <Users className="w-4 h-4 text-[#0f365e]" />
              <span>Team Leaders Roster</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
