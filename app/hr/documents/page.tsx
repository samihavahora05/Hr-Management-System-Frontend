'use client';

import React from 'react';
import { DocumentVaultManager } from '@/components/documents/DocumentVaultManager';

export default function HRDocumentsPage() {
  return (
    <DocumentVaultManager
      namespace="hr"
      title="HR Document Vault & Daily Work Reports"
      description="Manage workforce records, employee daily status reports, onboarding documents, and official company records"
    />
  );
}
