'use client';

import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';

export default function AdminRolesPage() {
  const roles = [
    { id: 1, name: 'admin', display_name: 'Admin', description: 'Full system configuration & administrative control' },
    { id: 2, name: 'hr', display_name: 'HR Manager', description: 'Manages employee records, recruitment ATS, and leave' },
    { id: 3, name: 'manager', display_name: 'Team Lead / Manager', description: 'Manages team attendance and leave approvals' },
    { id: 4, name: 'employee', display_name: 'Employee', description: 'Employee self-service access' },
  ];

  return (
    <PortalLayout namespace="admin">
      <PageHeader
        title="Role Definitions"
        description="Explicit RBAC roles, hierarchy boundaries, and description scopes"
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <TablePrimitive
          headers={['Role', 'System Key', 'Description']}
          rows={roles.map((r) => [
            <Badge key={r.name} variant="blue">{r.display_name}</Badge>,
            <span key="key" className="font-mono text-xs text-slate-600">{r.name}</span>,
            <span key="desc" className="text-xs text-slate-700">{r.description}</span>,
          ])}
        />
      </div>
    </PortalLayout>
  );
}
