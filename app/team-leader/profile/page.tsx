'use client';

import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/lib/auth-context';
import { User, Mail, Building2, ShieldCheck } from '@/components/ui/Icon';

export default function TeamLeaderProfilePage() {
  const { user } = useAuth();

  return (
    <PortalLayout namespace="team_leader">
      <PageHeader
        title="My Profile"
        description="Team Leader personal profile details and system access"
      />

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#0f365e] text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
            {user?.name ? user.name[0] : 'T'}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">{user?.name}</h3>
            <p className="text-xs text-slate-500 font-semibold">{user?.designation || 'Team Leader'}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-extrabold capitalize">
              {user?.role_display || 'Team Leader'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase block mb-1">Employee Code</span>
            <span className="font-bold text-slate-900">{user?.employee_code || 'EMP007'}</span>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase block mb-1">Department</span>
            <span className="font-bold text-slate-900">{user?.department || 'Engineering'}</span>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase block mb-1">Email Address</span>
            <span className="font-bold text-slate-900">{user?.email}</span>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase block mb-1">Manager</span>
            <span className="font-bold text-slate-900">{user?.manager_name || 'Rajesh Kumar (Company Manager)'}</span>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
