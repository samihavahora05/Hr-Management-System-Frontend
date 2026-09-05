'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { CalendarDays, Download, Clock, Plus, CheckCircle2, Megaphone, ListTodo, TrendingUp, ChevronRight } from '@/components/ui/Icon';

function formatTimeDisplay(timeStr?: string | null): string {
  if (!timeStr) return '';
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

interface EmployeeDashboardProps {
  user: any;
  summary: any;
  leaveBalances: any[];
  announcements: any[];
  onCheckIn: () => void;
  onCheckOut: () => void;
  checkingIn: boolean;
}

export function EmployeeDashboard({
  user,
  summary,
  leaveBalances = [],
  announcements = [],
  onCheckIn,
  onCheckOut,
  checkingIn,
}: EmployeeDashboardProps) {
  const [taskStats, setTaskStats] = useState<any>(null);

  useEffect(() => {
    fetchApi('/dashboard/stats')
      .then((res) => setTaskStats(res))
      .catch((err) => console.error('Failed to fetch employee task stats', err));
  }, []);

  const myTodayAttendance = summary?.my_today;
  const isCheckedIn = !!myTodayAttendance?.check_in;
  const isCheckedOut = !!myTodayAttendance?.check_out;

  const totalRemainingLeave = leaveBalances.reduce(
    (acc, b) => acc + (b.remaining !== undefined ? Number(b.remaining) : 0),
    0
  );

  const myTasks = taskStats?.tasks || {};
  const myRecentTasks = taskStats?.recent_tasks || [];

  return (
    <div className="space-y-6 text-slate-900">
      {/* PAGE HEADER STRIP */}
      <div className="pb-1 sm:pb-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome, {user?.name?.split(' ')[0] || 'Employee'}
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Personal Work Dashboard & Task Management Workspace
        </p>
      </div>

      {/* TOP 4 SUMMARY CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* MY WORK TASKS */}
        <Link
          href="/employee/tasks"
          className="group bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-4 sm:p-5 shadow-2xs block cursor-pointer min-w-0"
        >
          <div className="flex items-center justify-between text-slate-500 uppercase tracking-wider text-[10px] font-bold">
            <span className="flex items-center gap-1.5 group-hover:text-indigo-600 transition-colors truncate">
              <ListTodo className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform shrink-0" /> My Tasks
            </span>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-900 mt-2 font-mono flex items-baseline gap-2 flex-wrap">
            <span>{myTasks.total || 0}</span>
            <span className="text-xs font-semibold text-slate-500 font-sans">total work todos</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">{myTasks.completed || 0} completed • {myTasks.todo || 0} to do</p>
        </Link>

        {/* TASK COMPLETION RATE */}
        <Link
          href="/employee/tasks"
          className="group bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-4 sm:p-5 shadow-2xs block cursor-pointer min-w-0"
        >
          <div className="flex items-center justify-between text-slate-500 uppercase tracking-wider text-[10px] font-bold">
            <span className="flex items-center gap-1.5 group-hover:text-emerald-600 transition-colors truncate">
              <TrendingUp className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform shrink-0" /> Completion Rate
            </span>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2 font-mono flex items-baseline gap-2 flex-wrap">
            <span>{myTasks.completion_rate || 0}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${myTasks.completion_rate || 0}%` }} />
          </div>
        </Link>

        {/* LEAVE BALANCE */}
        <Link
          href="/employee/leave"
          className="group bg-white border border-slate-200 hover:border-[#0f365e]/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-4 sm:p-5 shadow-2xs block cursor-pointer min-w-0"
        >
          <div className="flex items-center justify-between text-slate-500 uppercase tracking-wider text-[10px] font-bold">
            <span className="flex items-center gap-1.5 group-hover:text-[#0f365e] transition-colors truncate">
              <CalendarDays className="w-4 h-4 text-slate-400 group-hover:text-[#0f365e] transition-colors shrink-0" /> Leave Quota
            </span>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0f365e] group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0f365e] mt-2 font-mono flex items-baseline gap-2 flex-wrap">
            <span>{totalRemainingLeave}</span>
            <span className="text-xs font-semibold text-slate-500 font-sans">days available</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Across all statutory leave types</p>
        </Link>

        {/* TODAY'S CHECK-IN */}
        <Link
          href="/attendance"
          className="group bg-white border border-slate-200 hover:border-slate-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-4 sm:p-5 shadow-2xs block cursor-pointer relative min-w-0"
        >
          <div className="flex items-center justify-between text-slate-500 uppercase tracking-wider text-[10px] font-bold">
            <span className="flex items-center gap-1.5 group-hover:text-slate-900 transition-colors truncate">
              <Clock className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" /> Today Attendance
            </span>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>

          {isCheckedIn ? (
            <>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-2 font-mono flex items-center justify-between flex-wrap gap-1">
                <span>In: {formatTimeDisplay(myTodayAttendance.check_in)}</span>
                {isCheckedOut && (
                  <span className="text-xs text-slate-600 font-semibold">Out: {formatTimeDisplay(myTodayAttendance.check_out)}</span>
                )}
              </div>
              <p className={`text-[10px] font-bold mt-2 flex items-center gap-1 truncate ${
                isCheckedOut 
                  ? 'text-indigo-700' 
                  : myTodayAttendance.status === 'late' 
                    ? 'text-amber-600' 
                    : 'text-emerald-700'
              }`}>
                {isCheckedOut 
                  ? (myTodayAttendance.notes?.includes('Auto check-out') ? '⚡ Auto Checked Out' : '✓ Checked Out') 
                  : (myTodayAttendance.status === 'late' ? '● Late (Checkout: 6PM)' : '✓ Active (Checkout: 6PM)')}
              </p>
            </>
          ) : (
            <>
              <div className="text-xl sm:text-2xl font-black text-slate-400 mt-2 font-mono tracking-widest">
                -- : -- : --
              </div>
              <p className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-2 inline-flex items-center gap-1">
                ⚠️ Not checked in today
              </p>
            </>
          )}
        </Link>
      </div>

      {/* RECENT ASSIGNED TASKS FOR EMPLOYEE */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-[#0f365e]" />
            <span>My Pending & Recent Tasks</span>
          </h3>
          <Link href="/employee/tasks" className="text-xs font-bold text-[#0f365e] hover:underline flex items-center gap-1">
            <span>Open Todo Tasker</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {myRecentTasks.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 font-medium">
            You currently have no tasks assigned to your employee account.
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            {myRecentTasks.slice(0, 4).map((t: any) => (
              <div key={t.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-extrabold text-slate-900 truncate">{t.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Assigned by <strong className="capitalize">{t.assigned_by_role}</strong> ({t.assigner?.name || 'Manager'}) • Due: {t.due_date || 'N/A'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize bg-white text-slate-700">
                    {t.status}
                  </span>
                  <Link href="/employee/tasks" className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-lg shadow-2xs transition-colors">
                    Complete Task
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ANNOUNCEMENTS FEED */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-2xs">
        <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-[#0f365e]" />
          <span>Announcements & Company Bulletins</span>
        </h3>

        {announcements.length === 0 ? (
          <p className="text-xs text-slate-400 font-medium py-4 text-center">No active announcements broadcast for your account.</p>
        ) : (
          <div className="space-y-4 text-xs">
            {announcements.slice(0, 3).map((ann) => (
              <div key={ann.id} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    Official Broadcast
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{ann.created_at?.slice(0, 10)}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mt-1">{ann.title}</h4>
                <p className="text-slate-600 text-xs mt-1 leading-relaxed">{ann.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM QUICK ACTIONS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <Link
          href="/employee/tasks"
          className="p-3.5 sm:p-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 font-bold rounded-xl border border-indigo-200 shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer text-xs sm:text-sm"
        >
          <ListTodo className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-900 shrink-0" />
          <span>View My Todo Tasker</span>
        </Link>

        <Link
          href="/employee/leave"
          className="p-3.5 sm:p-4 bg-sky-100 hover:bg-sky-200 text-sky-950 font-bold rounded-xl border border-sky-300 shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer text-xs sm:text-sm"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-sky-900 shrink-0" />
          <span>Apply for Leave</span>
        </Link>

        {(() => {
          const shiftEndTime = user?.shift?.end_time || '18:00:00';
          const isSaturday = new Date().getDay() === 6;
          const effectiveCutoffTime = isSaturday ? '14:00:00' : shiftEndTime;
          const cutoffHour = parseInt(effectiveCutoffTime.split(':')[0], 10);
          const cutoffMin = parseInt(effectiveCutoffTime.split(':')[1] || '0', 10);
          const now = new Date();
          const isPastAutoCheckout = now.getHours() > cutoffHour || (now.getHours() === cutoffHour && now.getMinutes() >= cutoffMin);

          return !isCheckedIn ? (
            <button
              onClick={onCheckIn}
              disabled={checkingIn}
              className="p-3.5 sm:p-4 bg-[#0f365e] hover:bg-[#164677] active:scale-[0.99] text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer text-xs sm:text-sm disabled:opacity-50 sm:col-span-2 md:col-span-1"
            >
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>{checkingIn ? 'Clocking In...' : 'Clock In Now'}</span>
            </button>
          ) : (!isCheckedOut && !isPastAutoCheckout) ? (
            <button
              onClick={onCheckOut}
              disabled={checkingIn}
              className="p-3.5 sm:p-4 bg-slate-800 hover:bg-slate-900 active:scale-[0.99] text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer text-xs sm:text-sm disabled:opacity-50 sm:col-span-2 md:col-span-1"
            >
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>{checkingIn ? 'Clocking Out...' : 'Clock Out'}</span>
            </button>
          ) : (
            <div className="p-3.5 sm:p-4 bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-2 text-xs sm:text-sm select-none sm:col-span-2 md:col-span-1 text-center">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
              <span>
                Shift Completed Today {isCheckedOut ? `(${formatTimeDisplay(myTodayAttendance?.check_out)})` : `(${formatTimeDisplay(effectiveCutoffTime)} Auto)`}
              </span>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
