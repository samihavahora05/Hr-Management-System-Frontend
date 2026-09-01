'use client';

import React from 'react';
import { DocumentVaultManager } from '@/components/documents/DocumentVaultManager';

export default function AdminDocumentsPage() {
  return (
    <DocumentVaultManager
      namespace="admin"
      title="Company Document Vault & Employee Daily Reports"
      description="Centralized master repository of employee daily work reports, signed contracts, identification proofs, and compliance documents across BLUEBOXX"
    />
  );
}
