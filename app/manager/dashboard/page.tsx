'use client';

import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';

export default function ManagerDashboardPage() {
  return (
    <PortalLayout namespace="manager">
      <PageHeader
        title="Company Manager Workspace"
        description="Team Leaders management, team workload tracking, and team task completion stats"
      />
      <ManagerDashboard />
    </PortalLayout>
  );
}
