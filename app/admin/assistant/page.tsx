'use client';

import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { AssistantChat } from '@/components/assistant/AssistantChat';

export default function AdminAssistantPage() {
  return (
    <PortalLayout namespace="admin">
      <PageHeader
        title="Organization AI Assistant"
        description="Ask intelligent queries about organization headcount, department growth, attendance trends, pending approvals, recruitment pipelines, and audit logs."
      />
      <AssistantChat portalScope="admin" />
    </PortalLayout>
  );
}
