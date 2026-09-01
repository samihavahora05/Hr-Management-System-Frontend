'use client';

import React from 'react';
import { DocumentVaultManager } from '@/components/documents/DocumentVaultManager';

export default function TeamLeaderDocumentsPage() {
  return (
    <DocumentVaultManager
      namespace="team_leader"
      title="Team Vault & Daily Work Reports"
      description="Submit daily progress reports and review documentation uploaded by your assigned team members"
    />
  );
}
