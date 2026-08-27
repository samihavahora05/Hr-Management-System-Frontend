'use client';

import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TaskManager } from '@/components/tasks/TaskManager';

export default function HRTasksPage() {
  return (
    <PortalLayout namespace="hr">
      <PageHeader
        title="Todo & Task Management"
        description="Assign work items, track task completion across departments, and monitor employee productivity"
      />
      <TaskManager portalScope="hr" />
    </PortalLayout>
  );
}
