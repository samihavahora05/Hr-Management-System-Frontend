'use client';

import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TeamLeaderDashboard } from '@/components/dashboard/TeamLeaderDashboard';

export default function TeamLeaderDashboardPage() {
  return (
    <PortalLayout namespace="team_leader">
      <PageHeader
        title="Team Leader Dashboard"
        description="Team workload monitoring, direct reports' task execution, and team productivity stats"
      />
      <TeamLeaderDashboard />
    </PortalLayout>
  );
}
