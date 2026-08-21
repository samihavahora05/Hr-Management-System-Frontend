'use client';

import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmployeeTaskPerformance } from '@/components/performance/EmployeeTaskPerformance';

export default function AdminPerformancePage() {
  return (
    <PortalLayout namespace="admin">
      <PageHeader
        title="Organization-Wide Performance Analytics"
        description="Comprehensive task completion scores, on-time rates, and productivity ratings across all employees, team leaders, and managers"
      />
      <EmployeeTaskPerformance portalScope="admin" />
    </PortalLayout>
  );
}
