'use client';

import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmployeeTaskPerformance } from '@/components/performance/EmployeeTaskPerformance';

export default function HRPerformancePage() {
  return (
    <PortalLayout namespace="hr">
      <PageHeader
        title="Employee Performance & Task Analytics"
        description="Real-time employee task completion ratings, quarterly performance scores, and workforce productivity metrics"
      />
      <EmployeeTaskPerformance portalScope="hr" />
    </PortalLayout>
  );
}
