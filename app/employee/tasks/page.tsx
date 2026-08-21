'use client';

import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TaskManager } from '@/components/tasks/TaskManager';

export default function EmployeeTasksPage() {
  return (
    <PortalLayout namespace="employee">
      <PageHeader
        title="My Tasks & Work Todos"
        description="View and update tasks assigned by your HR or Manager, complete action items, and manage personal todos"
      />
      <TaskManager portalScope="employee" />
    </PortalLayout>
  );
}
