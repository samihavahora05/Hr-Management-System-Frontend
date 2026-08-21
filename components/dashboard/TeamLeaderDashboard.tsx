'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import {
  Users,
  ListTodo,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  Plus,
} from '@/components/ui/Icon';

export function TeamLeaderDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/dashboard/stats')
      .then((res) => setStats(res))
      .catch((err) => console.error('Failed to load team leader stats', err))
      .finally(() => setLoading(false));
  }, []);

  const counts = stats?.counts || {};
  const tasks = stats?.tasks || {};
  const recentTasks = stats?.recent_tasks || [];

  return (
    <div className="space-y-6 text-slate-900">
      {/* KPI METRIC CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/team-leader/team"
          className="group bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-5 shadow-2xs block cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 uppercase tracking-wider text-[10px] font-bold">
            <span className="group-hover:text-slate-900 transition-colors">My Team Members</span>
            <Users className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div className="text-3xl font-black text-slate-900 font-mono">
              {counts.total_employees || 0}
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>

        <Link
          href="/team-leader/tasks"
          className="group bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-5 shadow-2xs block cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 uppercase tracking-wider text-[10px] font-bold">
            <span className="group-hover:text-indigo-600 transition-colors">Team Tasks</span>
            <ListTodo className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div className="text-3xl font-black text-indigo-700 font-mono">
              {tasks.total || 0}
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>

        <Link
          href="/team-leader/tasks"
          className="group bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-5 shadow-2xs block cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 uppercase tracking-wider text-[10px] font-bold">
            <span className="group-hover:text-emerald-600 transition-colors">Completed Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div className="text-3xl font-black text-emerald-700 font-mono">
              {tasks.completed || 0}
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>

        <Link
          href="/team-leader/tasks"
          className="group bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-5 shadow-2xs block cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 uppercase tracking-wider text-[10px] font-bold">
            <span className="group-hover:text-sky-600 transition-colors">Team Completion Rate</span>
            <TrendingUp className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div className="text-3xl font-black text-sky-700 font-mono">
              {tasks.completion_rate || 0}%
            </div>
            <ChevronRight className="w-4 h-4 text-sky-300 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>
      </div>

      {/* RECENT TEAM TASKS & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Recent Team Task Activity
            </h3>
            <Link href="/team-leader/tasks" className="text-xs font-bold text-[#0f365e] hover:underline">
              View All Tasks &rarr;
            </Link>
          </div>

          {recentTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-medium">
              No tasks assigned to your team yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((t: any) => (
                <div key={t.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-extrabold text-slate-900">{t.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Assigned to: <strong>{t.assignedTo?.name || 'Team Employee'}</strong> • Due: {t.due_date || 'N/A'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize bg-white text-slate-700">
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Team Leader Actions
          </h3>

          <div className="space-y-3 text-xs font-bold">
            <Link
              href="/team-leader/tasks"
              className="p-3.5 bg-[#0f365e] text-white hover:bg-[#164677] rounded-xl flex items-center gap-2 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Task to Team Employee</span>
            </Link>

            <Link
              href="/team-leader/tasks"
              className="p-3.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl flex items-center gap-3 transition-colors text-slate-800"
            >
              <ListTodo className="w-4 h-4 text-[#0f365e]" />
              <span>Team Task Manager</span>
            </Link>

            <Link
              href="/team-leader/team"
              className="p-3.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl flex items-center gap-3 transition-colors text-slate-800"
            >
              <Users className="w-4 h-4 text-[#0f365e]" />
              <span>View My Team Members</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
