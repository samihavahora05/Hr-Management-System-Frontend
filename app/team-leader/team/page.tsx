'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { fetchApi } from '@/lib/api';
import { Users, Mail, Building2, Download } from '@/components/ui/Icon';
import { exportToCSV } from '@/lib/export';

export default function TeamLeaderTeamPage() {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/employees')
      .then((res) => setTeamMembers(res.employees || []))
      .catch(() => setTeamMembers([]))
      .finally(() => setLoading(false));
  }, []);

  const handleExportCSV = () => {
    if (teamMembers.length === 0) return;
    const headers = ['Employee Name', 'Employee Code', 'Email', 'Designation', 'Department', 'Status'];
    const rows = teamMembers.map((m) => [
      m.name,
      m.employee_code || `EMP00${m.id}`,
      m.email,
      m.designation || 'Staff',
      m.department || 'N/A',
      m.status || 'active',
    ]);
    exportToCSV('Team_Leader_Employees_Roster', headers, rows);
  };

  return (
    <PortalLayout namespace="team_leader">
      <PageHeader
        title="My Team Members"
        description="Employees assigned to your team roster by your reporting manager"
        action={
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Roster</span>
          </button>
        }
      />

      {loading ? (
        <div className="py-12 text-center text-xs font-semibold text-slate-400 animate-pulse">
          Fetching team roster assigned by manager...
        </div>
      ) : teamMembers.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-2xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-extrabold text-slate-800">No Direct Team Employees Assigned</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Employees assigned to your leadership team by your Manager will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <TablePrimitive
              headers={['Team Member', 'Employee Code', 'Designation', 'Department', 'Status']}
              rows={teamMembers.map((member) => [
                <div key="emp">
                  <p className="font-extrabold text-slate-900 text-xs">{member.name}</p>
                  <p className="text-[10px] font-mono text-slate-400">{member.email}</p>
                </div>,
                <span key="code" className="font-mono text-xs text-[#0f365e] font-bold">{member.employee_code || `EMP00${member.id}`}</span>,
                <span key="des" className="text-xs text-slate-700">{member.designation || 'Staff'}</span>,
                <span key="dept" className="text-xs text-slate-700">{member.department || 'Engineering'}</span>,
                <Badge key="st" variant={member.status === 'active' ? 'green' : member.status === 'on_leave' ? 'yellow' : 'red'}>
                  {member.status || 'active'}
                </Badge>,
              ])}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {teamMembers.map((member) => (
              <div key={member.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0f365e] text-white font-extrabold text-sm flex items-center justify-center">
                    {member.name[0]}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{member.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{member.designation || 'Team Member'}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{member.department || 'Engineering'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
