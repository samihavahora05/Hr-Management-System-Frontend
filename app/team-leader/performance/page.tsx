'use client';

import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmployeeTaskPerformance } from '@/components/performance/EmployeeTaskPerformance';

export default function TeamLeaderPerformancePage() {
  return (
    <PortalLayout namespace="team_leader">
      <PageHeader
        title="Team Member Task Performance"
        description="Monitor individual team employees' task completion, on-time rates, and productivity scores"
      />
      <EmployeeTaskPerformance portalScope="team_leader" />
    </PortalLayout>
  );
}
