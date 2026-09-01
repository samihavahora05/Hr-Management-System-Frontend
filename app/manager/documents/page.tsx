'use client';

import React from 'react';
import { DocumentVaultManager } from '@/components/documents/DocumentVaultManager';

export default function ManagerDocumentsPage() {
  return (
    <DocumentVaultManager
      namespace="manager"
      title="Team Document Vault & Daily Work Reports"
      description="Review daily work reports, status submissions, and project documentation from all reporting team members"
    />
  );
}
