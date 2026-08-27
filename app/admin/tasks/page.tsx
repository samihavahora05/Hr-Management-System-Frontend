'use client';

import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TaskManager } from '@/components/tasks/TaskManager';

export default function AdminTasksPage() {
  return (
    <PortalLayout namespace="admin">
      <PageHeader
        title="Organization Task Tasker"
        description="Monitor and assign organizational tasks across all departments and roles"
      />
      <TaskManager portalScope="admin" />
    </PortalLayout>
  );
}
