'use client';

import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/lib/auth-context';

export default function EmployeeProfilePage() {
  const { user } = useAuth();

  return (
    <PortalLayout namespace="employee">
      <PageHeader
        title="My Employee Profile"
        description="Personal details, employment parameters, department alignment, and contact information"
      />

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-[#0f365e] text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
            {user?.name ? user.name[0] : 'U'}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{user?.name}</h2>
            <p className="text-xs font-mono font-bold text-[#0f365e]">{user?.employee_code || 'EMP004'}</p>
            <p className="text-xs text-slate-500 capitalize mt-0.5">{user?.designation || 'Staff'} | {user?.department || 'Engineering'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Email Address</label>
            <p className="font-mono text-sm text-slate-900 font-semibold">{user?.email}</p>
          </div>
          <div>
            <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Phone Number</label>
            <p className="text-sm text-slate-900 font-semibold">{user?.phone || '+91 98765 43213'}</p>
          </div>
          <div>
            <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Department</label>
            <p className="text-sm text-slate-900 font-semibold">{user?.department || 'Engineering'}</p>
          </div>
          <div>
            <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Designation</label>
            <p className="text-sm text-slate-900 font-semibold">{user?.designation || 'Senior Frontend Developer'}</p>
          </div>
          <div>
            <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Joining Date</label>
            <p className="text-sm text-slate-900 font-semibold">
              {user?.joining_date ? String(user.joining_date).split('T')[0].split(' ')[0] : '2024-02-01'}
            </p>
          </div>
          <div>
            <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Employment Status</label>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold capitalize">
              {user?.status || 'Active'}
            </span>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
