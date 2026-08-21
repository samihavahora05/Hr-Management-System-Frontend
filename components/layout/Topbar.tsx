'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { fetchApi } from '@/lib/api';
import { LogOut, Search, Settings, CheckCircle2, Clock } from '@/components/ui/Icon';
import { Toast } from '@/components/ui/Toast';

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

export function Topbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadTodayAttendance();
    } else {
      setLoadingAttendance(false);
    }
  }, [user]);

  const loadTodayAttendance = async () => {
    try {
      const res = await fetchApi('/attendance/summary');
      if (res.my_today) {
        setTodayAttendance(res.my_today);
      } else {
        setTodayAttendance(null);
      }
    } catch (e) {
      setTodayAttendance(null);
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Determine current active namespace from URL pathname
  let activeNamespace: 'admin' | 'hr' | 'manager' | 'employee' = 'employee';
  if (pathname.startsWith('/admin')) activeNamespace = 'admin';
  else if (pathname.startsWith('/hr')) activeNamespace = 'hr';
  else if (pathname.startsWith('/manager')) activeNamespace = 'manager';
  else if (pathname.startsWith('/employee')) activeNamespace = 'employee';
  else {
    activeNamespace = (user?.role as any) || 'employee';
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const clientTime = new Date().toTimeString().split(' ')[0]; // HH:MM:SS
      const res = await fetchApi('/attendance/check-in', {
        method: 'POST',
        body: JSON.stringify({ time: clientTime }),
      });
      const timeFormatted = formatTimeDisplay(res.attendance?.check_in) || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setToastMessage(res.message || `Checked in successfully at ${timeFormatted}`);
      setTodayAttendance(res.attendance);
    } catch (err: any) {
      setToastMessage(err.message || 'Already checked in today');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      const clientTime = new Date().toTimeString().split(' ')[0]; // HH:MM:SS
      const res = await fetchApi('/attendance/check-out', {
        method: 'POST',
        body: JSON.stringify({ time: clientTime }),
      });
      const timeFormatted = formatTimeDisplay(res.attendance?.check_out) || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setToastMessage(res.message || `Checked out successfully at ${timeFormatted}`);
      setTodayAttendance(res.attendance);
    } catch (err: any) {
      setToastMessage(err.message || 'Check out failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const directoryHref =
    activeNamespace === 'admin'
      ? '/admin/users'
      : activeNamespace === 'hr'
      ? '/hr/employees'
      : activeNamespace === 'manager'
      ? '/manager/team'
      : '/employee/profile';

  const reportsHref = `/${activeNamespace}/reports`;

  const isDirectoryActive = pathname.startsWith(directoryHref);
  const isReportsActive = pathname.startsWith(reportsHref);

  const hasCheckedIn = !!todayAttendance?.check_in;
  const hasCheckedOut = !!todayAttendance?.check_out;

  return (
    <header className="h-16 bg-white border-b border-[#c3c6cf] px-6 flex items-center justify-between sticky top-0 z-10 shadow-2xs text-xs">
      {/* Title & Search */}
      <div className="flex items-center gap-6">
        <span className="font-extrabold text-[#0f365e] text-lg tracking-tight">HRMS Portal</span>

        <div className="hidden md:flex items-center relative w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5" />
          <input
            type="text"
            placeholder="Search directory..."
            className="w-full pl-9 pr-3.5 py-1.5 bg-[#f9f9ff] border border-[#c3c6cf] rounded-lg text-xs text-slate-900 focus:bg-white focus:border-[#0f365e] focus:outline-hidden transition-all"
          />
        </div>
      </div>

      {/* Directory & Reports Navigation */}
      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center gap-6 text-sm font-bold text-slate-600 h-16">
          <Link
            href={directoryHref}
            className={`h-full flex items-center border-b-2 transition-all ${
              isDirectoryActive
                ? 'border-[#0f365e] text-[#0f365e] font-extrabold'
                : 'border-transparent text-slate-500 hover:text-[#0f365e]'
            }`}
          >
            Directory
          </Link>
          {activeNamespace !== 'employee' && (
            <Link
              href={reportsHref}
              className={`h-full flex items-center border-b-2 transition-all ${
                isReportsActive
                  ? 'border-[#0f365e] text-[#0f365e] font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-[#0f365e]'
              }`}
            >
              Reports
            </Link>
          )}
        </div>

        {/* CHECK IN & CHECK OUT BUTTONS */}
        {loadingAttendance ? (
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-xs font-medium animate-pulse">
              Syncing attendance status...
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Check In Button */}
            {hasCheckedIn ? (
              <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-lg flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>In: {formatTimeDisplay(todayAttendance.check_in)}</span>
              </div>
            ) : (
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-lg shadow-2xs transition-all cursor-pointer text-xs disabled:opacity-50 flex items-center gap-1.5"
                title="Record your daily check-in time"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{checkingIn ? 'Recording...' : 'Check In'}</span>
              </button>
            )}

            {/* Check Out Button */}
            {hasCheckedOut ? (
              <div className="px-3 py-1 bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-lg flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Out: {formatTimeDisplay(todayAttendance.check_out)}</span>
              </div>
            ) : (
              <button
                onClick={handleCheckOut}
                disabled={checkingOut || !hasCheckedIn}
                className={`px-3.5 py-1.5 font-bold rounded-lg shadow-2xs transition-all text-xs flex items-center gap-1.5 ${
                  hasCheckedIn
                    ? 'bg-rose-600 hover:bg-rose-700 active:scale-95 text-white cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
                title={!hasCheckedIn ? 'Must check in first before checking out' : 'Record your daily check-out time'}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{checkingOut ? 'Recording...' : 'Check Out'}</span>
              </button>
            )}
          </div>
        )}

        {/* User Account Controls */}
        <div className="flex items-center gap-3 border-l border-[#c3c6cf] pl-4">
          <Link
            href={activeNamespace === 'admin' ? '/admin/settings' : `/${activeNamespace}/dashboard`}
            className="text-slate-500 hover:text-[#0f365e] transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>

          <div
            className="w-8 h-8 rounded-full bg-[#0f365e] text-white font-bold text-xs flex items-center justify-center shadow-2xs cursor-default"
            title={user?.name || 'User'}
          >
            {user?.name ? user.name[0] : 'U'}
          </div>

          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-[#ba1a1a] transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </header>
  );
}
