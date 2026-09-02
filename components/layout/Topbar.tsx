'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { fetchApi } from '@/lib/api';
import { LogOut, Search, Settings, CheckCircle2, Clock, Bell } from '@/components/ui/Icon';
import { Toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';

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
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadTodayAttendance();
      loadUnreadNotifications();
    } else {
      setLoadingAttendance(false);
    }
  }, [user, pathname]);

  const loadUnreadNotifications = async () => {
    try {
      const res = await fetchApi('/notifications');
      if (typeof res.unread_count === 'number') {
        setUnreadCount(res.unread_count);
      }
      if (res.notifications) {
        setNotificationsList(res.notifications);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleToggleNotifDropdown = async () => {
    const nextState = !isNotifDropdownOpen;
    setIsNotifDropdownOpen(nextState);
    if (nextState) {
      setLoadingNotifs(true);
      try {
        const res = await fetchApi('/notifications');
        const list = res.notifications || [];
        setNotificationsList(list);
        if (typeof res.unread_count === 'number') {
          setUnreadCount(res.unread_count);
        }

        // When user opens the notification dropdown, automatically mark unread notifications as read
        if (res.unread_count && res.unread_count > 0) {
          fetchApi('/notifications/read-all', { method: 'POST' }).catch(() => {});
          setUnreadCount(0);
          setNotificationsList(list.map((n: any) => ({ ...n, is_read: true })));
        }
      } catch (e) {
        // ignore
      } finally {
        setLoadingNotifs(false);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetchApi('/notifications/read-all', { method: 'POST' });
      setUnreadCount(0);
      setNotificationsList((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setToastMessage('All notifications marked as read');
    } catch (e: any) {
      setToastMessage(e.message || 'Failed to mark all as read');
    }
  };

  const handleNotificationClick = async (notif: any) => {
    // Automatically mark it as read immediately
    if (!notif.is_read) {
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotificationsList((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      try {
        await fetchApi(`/notifications/${notif.id}/read`, { method: 'POST' });
      } catch (e) {
        // ignore
      }
    }

    setIsNotifDropdownOpen(false);
    setSelectedNotif(notif);
    setIsNotifModalOpen(true);
  };

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
      : '/profile';

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
        <div className="flex items-center gap-3 border-l border-[#c3c6cf] pl-4 relative">
          {/* Notifications Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={handleToggleNotifDropdown}
              className="text-slate-500 hover:text-[#0f365e] transition-colors relative p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute 0 top-0.5 right-0.5 min-w-[15px] h-[15px] px-0.5 bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* FLOATING NOTIFICATION POPUP */}
            {isNotifDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsNotifDropdownOpen(false)}
                />
                <div className="absolute right-0 top-11 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-150">
                  {/* POPUP HEADER */}
                  <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-900">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-black rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* NOTIFICATION LIST */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {loadingNotifs ? (
                      <div className="p-6 text-center text-xs text-slate-400 font-medium animate-pulse">
                        Loading notifications...
                      </div>
                    ) : notificationsList.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700">No notifications yet</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">We'll alert you when there's an update</p>
                      </div>
                    ) : (
                      notificationsList.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 ${
                            !n.is_read ? 'bg-indigo-50/40' : ''
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            !n.is_read ? 'bg-indigo-600 animate-pulse' : 'bg-transparent'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-extrabold text-xs text-slate-900 leading-tight">
                              {n.title}
                            </p>
                            <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                              {n.message}
                            </p>
                            <span className="text-[9px] font-semibold text-slate-400 mt-1 block">
                              {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* POPUP FOOTER */}
                  <div className="p-2.5 bg-slate-50/80 border-t border-slate-100 text-center">
                    <Link
                      href="/notifications"
                      onClick={() => setIsNotifDropdownOpen(false)}
                      className="text-xs font-bold text-[#0f365e] hover:underline inline-flex items-center gap-1"
                    >
                      <span>View Notification Center</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          <Link
            href={activeNamespace === 'admin' ? '/admin/settings' : `/${activeNamespace}/dashboard`}
            className="text-slate-500 hover:text-[#0f365e] transition-colors p-1"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>

          <Link
            href="/profile"
            className="w-8 h-8 rounded-full bg-[#0f365e] hover:bg-[#164677] active:scale-95 text-white font-bold text-xs flex items-center justify-center shadow-2xs transition-all ring-offset-1 hover:ring-2 hover:ring-[#0f365e] cursor-pointer"
            title={`${user?.name || 'User'} (My Profile)`}
          >
            {user?.name ? user.name[0] : 'U'}
          </Link>

          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-[#ba1a1a] transition-colors cursor-pointer p-1"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />

      {/* NOTIFICATION DETAIL MODAL */}
      <Modal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        title={selectedNotif?.title || 'Notification Details'}
        maxWidth="md"
      >
        {selectedNotif && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  selectedNotif.type === 'success'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedNotif.type === 'warning'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-indigo-100 text-[#0f365e]'
                }`}
              >
                {selectedNotif.type || 'Notice'}
              </span>
              <span className="font-mono text-slate-400 text-[11px]">
                {selectedNotif.created_at
                  ? new Date(selectedNotif.created_at).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : 'Recently'}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-slate-900 mb-2">
                {selectedNotif.title}
              </h3>
              <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                {selectedNotif.message}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Marked as read
              </span>

              <div className="flex items-center gap-2">
                {(selectedNotif.link || selectedNotif.action_url) && (
                  <button
                    onClick={() => {
                      setIsNotifModalOpen(false);
                      router.push(selectedNotif.link || selectedNotif.action_url);
                    }}
                    className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    View Related Page →
                  </button>
                )}
                <button
                  onClick={() => setIsNotifModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </header>
  );
}
