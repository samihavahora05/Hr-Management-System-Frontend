'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { fetchApi } from '@/lib/api';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In Phase 2/4 backend, audit-logs endpoint will return audit logs
    fetchApi('/admin/audit-logs')
      .then((res) => setLogs(res.audit_logs || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PortalLayout namespace="admin">
      <PageHeader
        title="System Audit Trail"
        description="Immutable system actions, user logins, attendance corrections, and administrative events"
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium">
            Fetching system audit log records from database...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">
            No audit log records recorded yet. Actions will record automatically upon user login, employee creation, and approval workflows.
          </div>
        ) : (
          <TablePrimitive
            headers={['Timestamp', 'Actor ID', 'Action', 'Target Type', 'Target ID']}
            rows={logs.map((l) => [
              <span key="time" className="font-mono text-xs text-slate-600">{l.created_at}</span>,
              <span key="actor" className="font-bold text-slate-800">User #{l.actor_id}</span>,
              <Badge key="action" variant="blue">{l.action}</Badge>,
              l.target_type || 'N/A',
              l.target_id ? `#${l.target_id}` : 'N/A',
            ])}
          />
        )}
      </div>
    </PortalLayout>
  );
}
