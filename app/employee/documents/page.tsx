'use client';

import React from 'react';
import { DocumentVaultManager } from '@/components/documents/DocumentVaultManager';

export default function EmployeeDocumentsPage() {
  return (
    <DocumentVaultManager
      namespace="employee"
      title="My Document Vault & Daily Work Reports"
      description="Submit your daily work reports to Admin/Managers and manage contracts, identification, and certificates"
    />
  );
}
