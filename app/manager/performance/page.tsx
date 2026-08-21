'use client';

import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmployeeTaskPerformance } from '@/components/performance/EmployeeTaskPerformance';

export default function ManagerPerformancePage() {
  return (
    <PortalLayout namespace="manager">
      <PageHeader
        title="Team Task Performance & Leaderboard"
        description="Monitor team members' task completion rates, evaluate quarterly output, and track team productivity"
      />
      <EmployeeTaskPerformance portalScope="manager" />
    </PortalLayout>
  );
}
