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
} from '@/components/ui/Icon';

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/dashboard/stats')
      .then((res) => setStats(res))
      .catch((err) => console.error('Failed to load admin stats', err))
      .finally(() => setLoading(false));
  }, []);

  const counts = stats?.counts || {};
  const tasks = stats?.tasks || {};
  const recentTasks = stats?.recent_tasks || [];

  return (
    <div className="space-y-6 text-slate-900">
      {/* 5 ROLE COUNTS SUMMARY ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/admin/users"
          className="group bg-white border border-slate-200 hover:border-slate-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-4 shadow-2xs block cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-extrabold uppercase">
            <span className="group-hover:text-slate-900 transition-colors">Total Employees</span>
            <Users className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className="text-2xl font-black text-slate-900 font-mono">
              {counts.total_employees || 0}
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>

        <Link
          href="/admin/users"
          className="group bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-4 shadow-2xs block cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-extrabold uppercase">
            <span className="group-hover:text-indigo-600 transition-colors">HR Managers</span>
            <ShieldCheck className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className="text-2xl font-black text-indigo-700 font-mono">
              {counts.total_hr || 0}
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>

        <Link
          href="/admin/users"
          className="group bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-4 shadow-2xs block cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-extrabold uppercase">
            <span className="group-hover:text-sky-600 transition-colors">Company Managers</span>
            <Building2 className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className="text-2xl font-black text-sky-700 font-mono">
              {counts.total_managers || 0}
            </div>
            <ChevronRight className="w-4 h-4 text-sky-300 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>

        <Link
          href="/admin/users"
          className="group bg-white border border-slate-200 hover:border-amber-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-4 shadow-2xs block cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-extrabold uppercase">
            <span className="group-hover:text-amber-600 transition-colors">Team Leaders</span>
            <UserCheck className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className="text-2xl font-black text-amber-700 font-mono">
              {counts.total_team_leaders || 0}
            </div>
            <ChevronRight className="w-4 h-4 text-amber-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>
      </div>

      {/* TASK STATS SUMMARY ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Link
          href="/admin/tasks"
          className="group bg-white border border-slate-200 hover:border-slate-400 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-4 shadow-2xs block cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 group-hover:text-slate-700 transition-colors">
              Total Tasks
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-all" />
          </div>
          <span className="text-2xl font-black text-slate-900">{tasks.total || 0}</span>
        </Link>

        <Link
          href="/admin/tasks"
          className="group bg-white border border-slate-200 hover:border-amber-400 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-4 shadow-2xs block cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-extrabold uppercase text-amber-600 group-hover:text-amber-700 transition-colors">
              To Do
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-amber-300 group-hover:text-amber-600 transition-all" />
          </div>
          <span className="text-2xl font-black text-amber-600">{tasks.todo || 0}</span>
        </Link>

        <Link
          href="/admin/tasks"
          className="group bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-4 shadow-2xs block cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-extrabold uppercase text-indigo-600 group-hover:text-indigo-700 transition-colors">
              In Progress
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-indigo-300 group-hover:text-indigo-600 transition-all" />
          </div>
          <span className="text-2xl font-black text-indigo-600">{tasks.in_progress || 0}</span>
        </Link>

        <Link
          href="/admin/tasks"
          className="group bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-4 shadow-2xs block cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-extrabold uppercase text-emerald-600 group-hover:text-emerald-700 transition-colors">
              Completed
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-300 group-hover:text-emerald-600 transition-all" />
          </div>
          <span className="text-2xl font-black text-emerald-600">{tasks.completed || 0}</span>
        </Link>

        <Link
          href="/admin/tasks"
          className="group bg-white border border-rose-200 bg-rose-50/20 hover:border-rose-400 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-4 shadow-2xs block cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-extrabold uppercase text-rose-600 group-hover:text-rose-700 transition-colors">
              Overdue
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-rose-300 group-hover:text-rose-600 transition-all" />
          </div>
          <span className="text-2xl font-black text-rose-600">{tasks.overdue || 0}</span>
        </Link>
      </div>

      {/* RECENT ORGANIZATION TASKS & SHORTCUTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Organization Task Activity Overview
            </h3>
            <Link href="/admin/tasks" className="text-xs font-bold text-[#0f365e] hover:underline">
              View All Tasks &rarr;
            </Link>
          </div>

          {recentTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-medium">
              No organization tasks created yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((t: any) => (
                <div key={t.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-extrabold text-slate-900">{t.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Assigned by <strong className="capitalize">{t.assigned_by_role}</strong> to <strong className="capitalize">{t.assigned_to_role}</strong> ({t.assignedTo?.name || 'User'})
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize bg-white text-slate-700">
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Admin Management Quick Actions
          </h3>

          <div className="space-y-3 text-xs font-bold">
            <Link
              href="/admin/tasks"
              className="p-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl flex items-center gap-3 transition-colors text-slate-800"
            >
              <ListTodo className="w-4 h-4 text-[#0f365e]" />
              <span>Assign Task to HR / Manager</span>
            </Link>

            <Link
              href="/admin/users"
              className="p-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl flex items-center gap-3 transition-colors text-slate-800"
            >
              <Users className="w-4 h-4 text-[#0f365e]" />
              <span>Manage User Accounts</span>
            </Link>

            <Link
              href="/admin/performance"
              className="p-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl flex items-center gap-3 transition-colors text-slate-800"
            >
              <TrendingUp className="w-4 h-4 text-[#0f365e]" />
              <span>Organization Performance Report</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
