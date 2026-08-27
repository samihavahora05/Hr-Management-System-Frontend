'use client';

import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';

export default function AdminDashboardPage() {
  return (
    <PortalLayout namespace="admin">
      <PageHeader
        title="Admin System Control Center"
        description="Organization-wide task overview, role hierarchy management, and system performance"
      />
      <AdminDashboard />
    </PortalLayout>
  );
}
