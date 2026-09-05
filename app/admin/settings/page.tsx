'use client';

import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';

export default function AdminSettingsPage() {
  return (
    <PortalLayout namespace="admin">
      <PageHeader
        title="System Administration Settings"
        description="Global system preferences, security policies, and database connection status"
      />

      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Database Engine</h3>
            <p className="text-xs text-slate-500">Development SQLite database connection state</p>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-mono text-xs font-bold rounded-full self-start sm:self-center shrink-0">
            Active / Connected
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Token-Based Authentication</h3>
            <p className="text-xs text-slate-500">Explicit bearer token authorization middleware</p>
          </div>
          <span className="px-3 py-1 bg-sky-100 text-sky-800 font-mono text-xs font-bold rounded-full self-start sm:self-center shrink-0">
            Enforced
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Role Architecture Mode</h3>
            <p className="text-xs text-slate-500">Separated explicit namespaces (/admin, /hr, /manager, /employee)</p>
          </div>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 font-mono text-xs font-bold rounded-full self-start sm:self-center shrink-0">
            Strict Non-Inheriting
          </span>
        </div>
      </div>
    </PortalLayout>
  );
}
