'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Bell, CheckCircle, CheckCircle2 } from '@/components/ui/Icon';

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/notifications');
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNotification = async (notif: any) => {
    setSelectedNotif(notif);
    setIsDetailModalOpen(true);

    // Automatically mark as read if not already read
    if (!notif.is_read) {
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      try {
        await fetchApi(`/notifications/${notif.id}/read`, { method: 'POST' });
      } catch (err) {
        // ignore
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetchApi('/notifications/read-all', { method: 'POST' });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setToastMessage('All notifications marked as read');
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to mark notifications');
    }
  };

  const getNamespace = (): 'admin' | 'hr' | 'manager' | 'team_leader' | 'employee' => {
    const r = (user?.role || '').toLowerCase();
    if (r === 'admin') return 'admin';
    if (r === 'hr') return 'hr';
    if (r === 'manager' || r === 'company_manager') return 'manager';
    if (r === 'team_leader' || r === 'tl' || r === 'team_lead') return 'team_leader';
    return 'employee';
  };

  return (
    <PortalLayout namespace={getNamespace()}>
      <PageHeader
        title="Notifications Center"
        description="System activity alerts, leave status updates, task assignments, and organizational announcements."
        action={
          unreadCount > 0 ? (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Mark All as Read</span>
            </button>
          ) : null
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden divide-y divide-slate-100">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium animate-pulse">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-extrabold text-slate-800 mb-1">No Notifications</p>
            <p className="text-xs text-slate-500">You are all caught up! Real-time alerts will appear here.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleOpenNotification(n)}
              className={`p-4 flex items-start justify-between gap-4 transition-all cursor-pointer hover:bg-slate-50/80 ${
                !n.is_read ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : 'bg-white'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-xs ${
                    n.type === 'success'
                      ? 'bg-emerald-600'
                      : n.type === 'warning'
                      ? 'bg-amber-600'
                      : 'bg-[#0f365e]'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-extrabold text-slate-900 leading-snug">
                      {n.title}
                    </h4>
                    {!n.is_read && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>
                  <span className="font-mono text-[10px] text-slate-400 mt-1.5 block">
                    {n.created_at ? new Date(n.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-center">
                {!n.is_read ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" title="Unread" />
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">Read</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* NOTIFICATION DETAIL MODAL */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
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
                      setIsDetailModalOpen(false);
                      router.push(selectedNotif.link || selectedNotif.action_url);
                    }}
                    className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    View Related Page →
                  </button>
                )}
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
