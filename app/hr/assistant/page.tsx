'use client';

import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { AssistantChat } from '@/components/assistant/AssistantChat';

export default function HRAssistantPage() {
  return (
    <PortalLayout namespace="hr">
      <PageHeader
        title="HR Operations Assistant"
        description="Query active workforce metrics, recruitment pipelines, leave queues, and attendance oversight"
      />
      <AssistantChat portalScope="hr" />
    </PortalLayout>
  );
}
