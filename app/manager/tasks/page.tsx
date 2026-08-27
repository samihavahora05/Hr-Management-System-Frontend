'use client';

import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TaskManager } from '@/components/tasks/TaskManager';

export default function ManagerTasksPage() {
  return (
    <PortalLayout namespace="manager">
      <PageHeader
        title="Team Task Tasker"
        description="Assign work to team members, set priorities, and track progress across your direct reports"
      />
      <TaskManager portalScope="manager" />
    </PortalLayout>
  );
}
