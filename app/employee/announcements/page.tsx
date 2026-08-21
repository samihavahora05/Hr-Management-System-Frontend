'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { fetchApi } from '@/lib/api';
import { Megaphone, Pin } from '@/components/ui/Icon';

export default function EmployeeAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/announcements')
      .then((res) => setAnnouncements(res.announcements || []))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PortalLayout namespace="employee">
      <PageHeader
        title="Company Announcements & Bulletins"
        description="Official broadcasts, holiday notices, and corporate updates"
      />

      {loading ? (
        <div className="py-12 flex justify-center text-slate-400 text-xs font-semibold animate-pulse">
          Loading company announcements...
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-2xs">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-extrabold text-slate-800 mb-1">No Active Announcements</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You are up to date! New announcements from HR or Management will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div
              key={a.id}
              className={`bg-white rounded-xl border p-5 shadow-2xs transition-all ${
                a.is_pinned ? 'border-sky-300 bg-sky-50/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {a.is_pinned && (
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold flex items-center gap-1">
                    <Pin className="w-3 h-3" /> Pinned
                  </span>
                )}
                <h3 className="font-extrabold text-slate-900 text-base">{a.title}</h3>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed mb-4 whitespace-pre-wrap">{a.content}</p>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-100">
                <span>Posted by {a.author?.name || 'HR Team'}</span>
                <span>{a.created_at?.slice(0, 10)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}
