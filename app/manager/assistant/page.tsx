'use client';

import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { AssistantChat } from '@/components/assistant/AssistantChat';

export default function ManagerAssistantPage() {
  return (
    <PortalLayout namespace="manager">
      <PageHeader
        title="Team Management Assistant"
        description="Query your team's attendance status, pending leave reviews, and team member summaries"
      />
      <AssistantChat portalScope="manager" />
    </PortalLayout>
  );
}
