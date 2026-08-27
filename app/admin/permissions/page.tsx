'use client';

import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';

export default function AdminPermissionsPage() {
  const permissions = [
    { key: 'users.manage', name: 'Manage System Users', roles: ['admin'] },
    { key: 'organization.settings', name: 'Manage Organization Settings', roles: ['admin'] },
    { key: 'audit_logs.view', name: 'View System Audit Logs', roles: ['admin'] },
    { key: 'employees.crud', name: 'HR Employee Management', roles: ['hr'] },
    { key: 'leave.approve', name: 'Approve Leave Requests', roles: ['hr', 'manager'] },
    { key: 'team.view', name: 'View Direct Team Roster', roles: ['manager'] },
    { key: 'self_service.access', name: 'Employee Self-Service Access', roles: ['employee', 'manager', 'hr', 'admin'] },
  ];

  return (
    <PortalLayout namespace="admin">
      <PageHeader
        title="Permission Matrix"
        description="Explicit capability mapping and endpoint policy bindings"
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <TablePrimitive
          headers={['Permission Key', 'Feature Description', 'Explicit Roles Granted']}
          rows={permissions.map((p) => [
            <span key="key" className="font-mono text-xs text-slate-800 font-bold">{p.key}</span>,
            <span key="name" className="text-xs text-slate-700">{p.name}</span>,
            <div key="roles" className="flex gap-1 flex-wrap">
              {p.roles.map((r) => (
                <Badge key={r} variant={r === 'admin' ? 'purple' : r === 'hr' ? 'blue' : r === 'manager' ? 'yellow' : 'gray'}>
                  {r}
                </Badge>
              ))}
            </div>,
          ])}
        />
      </div>
    </PortalLayout>
  );
}
