'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { fetchApi } from '@/lib/api';

export default function AdminOrganizationPage() {
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/settings/organization')
      .then((res) => setOrg(res.organization))
      .catch(() => setOrg(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PortalLayout namespace="admin">
      <PageHeader
        title="Organization Configuration"
        description="Company details, holiday calendar, and fiscal settings"
      />

      {loading ? (
        <div className="py-12 flex justify-center text-slate-400 text-xs font-semibold animate-pulse">
          Loading organization details from database...
        </div>
      ) : !org ? (
        <div className="p-8 text-center text-xs text-slate-500 font-medium bg-white rounded-xl border border-slate-200">
          No organization metadata found.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Company Name</label>
              <p className="text-base font-extrabold text-slate-900">{org.name}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Organization Code</label>
              <p className="text-base font-mono font-bold text-[#0f365e]">{org.code}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Default Currency</label>
              <p className="text-sm font-semibold text-slate-800">{org.settings?.currency || 'INR'}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Timezone</label>
              <p className="text-sm font-semibold text-slate-800">{org.settings?.timezone || 'Asia/Kolkata'}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Statutory Holiday Calendar (2026)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(org.settings?.holiday_calendar || []).map((h: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{h.title}</p>
                    <p className="text-[10px] font-mono text-slate-500">{h.date}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Official Holiday
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
