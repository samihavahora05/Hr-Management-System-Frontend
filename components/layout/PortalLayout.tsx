'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { RoleGuard } from '@/components/layout/RoleGuard';

interface PortalLayoutProps {
  children: React.ReactNode;
  namespace: 'admin' | 'hr' | 'manager' | 'team_leader' | 'employee';
}

export function PortalLayout({ children, namespace }: PortalLayoutProps) {
  return (
    <RoleGuard requiredNamespace={namespace}>
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 w-full">
          <Topbar />
          <main className="p-3 sm:p-5 md:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden animate-in fade-in duration-200">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
