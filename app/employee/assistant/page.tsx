'use client';

import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { AssistantChat } from '@/components/assistant/AssistantChat';

export default function EmployeeAssistantPage() {
  return (
    <PortalLayout namespace="employee">
      <PageHeader
        title="Personal Admin Assistant"
        description="Query your leave quotas, today's attendance status, department details, and company policies"
      />
      <AssistantChat portalScope="employee" />
    </PortalLayout>
  );
}
