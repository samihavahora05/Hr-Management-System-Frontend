'use client';

import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TaskManager } from '@/components/tasks/TaskManager';

export default function TeamLeaderTasksPage() {
  return (
    <PortalLayout namespace="team_leader">
      <PageHeader
        title="Team Leader Task Management"
        description="Delegate tasks to team employees, manage task assignments, and monitor team workload"
      />
      <TaskManager portalScope="team_leader" />
    </PortalLayout>
  );
}
