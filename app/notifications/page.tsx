'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toast } from '@/components/ui/Toast';
import { fetchApi } from '@/lib/api';
import { Bell, CheckCircle } from '@/components/ui/Icon';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const handleMarkAllRead = async () => {
    try {
      await fetchApi('/notifications/read-all', { method: 'POST' });
      setToastMessage('All notifications marked as read');
      loadNotifications();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to mark notifications');
    }
  };

  return (
    <PortalLayout namespace="employee">
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
              className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                !n.is_read ? 'bg-blue-50/50' : 'bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                    n.type === 'success'
                      ? 'bg-emerald-600'
                      : n.type === 'warning'
                      ? 'bg-amber-600'
                      : 'bg-[#0f365e]'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">{n.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                  <span className="font-mono text-[10px] text-slate-400 mt-1 block">
                    {n.created_at?.slice(0, 16) || 'Just now'}
                  </span>
                </div>
              </div>

              {!n.is_read && (
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-1" />
              )}
            </div>
          ))
        )}
      </div>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
