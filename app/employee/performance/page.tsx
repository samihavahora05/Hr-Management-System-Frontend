'use client';

import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth-context';

export default function EmployeePerformancePage() {
  const { user } = useAuth();

  return (
    <PortalLayout namespace="employee">
      <PageHeader
        title="My Performance & Appraisal Feedback"
        description="Key performance indicators, manager reviews, and goal tracking"
      />

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Current Review Cycle: Q3 2026</h3>
            <p className="text-xs text-slate-500">Evaluated by Direct Manager</p>
          </div>
          <Badge variant="green">Meets Expectations</Badge>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Key Objectives & Deliverables</h4>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">1. Refactor System Architecture to Role Namespaces</span>
              <span className="font-mono font-bold text-emerald-700">100% Completed</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">2. Enforce Row-Level Security & Authorization</span>
              <span className="font-mono font-bold text-emerald-700">100% Completed</span>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
