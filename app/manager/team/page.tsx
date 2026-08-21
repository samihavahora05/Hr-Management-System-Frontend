'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { exportToCSV } from '@/lib/export';
import { UserPlus, Download, UserMinus } from '@/components/ui/Icon';

export default function ManagerTeamPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState<any[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [teamLeaders, setTeamLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Team Member Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    setLoading(true);
    try {
      const [teamRes, allRes] = await Promise.all([
        fetchApi('/employees?team_only=true'),
        fetchApi('/employees?all=true').catch(() => ({ employees: [] })),
      ]);

      const currentTeam = teamRes.employees || [];
      const orgEmps = allRes.employees || [];
      setTeam(currentTeam);

      // Extract available team leaders
      const tls = orgEmps.filter((e: any) => {
        const rName = (e.role?.name || e.role || '').toLowerCase();
        return rName.includes('lead') || rName.includes('team_leader');
      });
      setTeamLeaders(tls);

      // Filter out employees who are already in this manager's direct team
      const available = orgEmps.filter(
        (emp: any) => emp.manager_id !== user?.id && emp.id !== user?.id
      );
      setAllEmployees(available);
      if (available.length > 0) {
        setSelectedEmpId(available[0].id.toString());
      }
      if (user) {
        setSelectedAssigneeId(user.id.toString());
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to load team roster');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !selectedAssigneeId) return;
    setSubmitting(true);

    try {
      await fetchApi(`/employees/${selectedEmpId}`, {
        method: 'PUT',
        body: JSON.stringify({ manager_id: parseInt(selectedAssigneeId) }),
      });

      setToastMessage('Employee assigned to team roster successfully!');
      setIsModalOpen(false);
      await loadTeamData();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to assign team member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveTeamMember = async (empId: number, empName: string) => {
    if (!confirm(`Are you sure you want to remove ${empName} from your team?`)) return;

    try {
      await fetchApi(`/employees/${empId}`, {
        method: 'PUT',
        body: JSON.stringify({ remove_from_team: true }),
      });

      setToastMessage(`${empName} has been removed from your team.`);
      await loadTeamData();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to remove team member');
    }
  };

  const handleExportExcel = () => {
    if (team.length === 0) {
      setToastMessage('No direct team data available to export.');
      return;
    }
    const headers = ['Team Member', 'Employee Code', 'Email', 'Designation', 'Department', 'Status'];
    const rows = team.map((m) => [
      m.name,
      m.employee_code || `EMP00${m.id}`,
      m.email,
      m.designation || 'Staff',
      m.department || 'N/A',
      m.status || 'active',
    ]);
    exportToCSV('Direct_Team_Roster', headers, rows);
    setToastMessage('Direct Team Roster exported to Excel CSV format successfully!');
  };

  return (
    <PortalLayout namespace="manager">
      <PageHeader
        title="Direct Team & Team Leaders Roster"
        description="Manage reporting team leaders and team members assigned to leadership roles"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              title="Export team employees to Excel CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export to Excel</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Team Member</span>
            </button>
          </div>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium">
            Fetching direct team roster...
          </div>
        ) : team.length === 0 ? (
          <div className="p-12 text-center rounded-xl">
            <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-extrabold text-slate-800 mb-1">No Team Members Assigned</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Click &quot;Add Team Member&quot; above to assign employees to your direct management team or team leaders.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#0f365e] text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Assign First Member
            </button>
          </div>
        ) : (
          <TablePrimitive
            headers={['Team Member', 'Employee Code', 'Designation', 'Department', 'Status', 'Actions']}
            rows={team.map((m) => [
              <div key="emp">
                <p className="font-extrabold text-slate-900 text-xs">
                  {m.name} {m.id === user?.id && <span className="text-[10px] text-sky-700 font-bold">(You - Lead)</span>}
                </p>
                <p className="text-[10px] font-mono text-slate-400">{m.email}</p>
              </div>,
              <span key="code" className="font-mono text-xs text-[#0f365e] font-bold">{m.employee_code || `EMP00${m.id}`}</span>,
              <span key="des" className="text-xs text-slate-700">{m.designation || 'Staff'}</span>,
              <span key="dept" className="text-xs text-slate-700">{m.department || 'Engineering'}</span>,
              <Badge key="status" variant={m.status === 'active' ? 'green' : m.status === 'on_leave' ? 'yellow' : 'red'}>
                {m.status || 'active'}
              </Badge>,
              <div key="actions">
                {m.id === user?.id ? (
                  <span className="text-[11px] text-slate-400 font-medium italic">Lead (Self)</span>
                ) : (
                  <button
                    onClick={() => handleRemoveTeamMember(m.id, m.name)}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                    title={`Remove ${m.name} from team`}
                  >
                    <UserMinus className="w-3.5 h-3.5 text-rose-600" />
                    <span>Remove</span>
                  </button>
                )}
              </div>,
            ])}
          />
        )}
      </div>

      {/* ASSIGN TEAM MEMBER MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Assign New Team Member to Leadership Roster">
        <form onSubmit={handleAssignTeamMember} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">1. Select Employee to Add</label>
            {allEmployees.length === 0 ? (
              <p className="text-xs text-slate-500 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                All organization employees are already assigned to a team profile.
              </p>
            ) : (
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-[#0f365e]"
              >
                {allEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employee_code || `EMP${emp.id}`}) - {emp.designation || 'Staff'} ({emp.department || 'General'})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">2. Assign To Reporting Manager / Team Leader</label>
            <select
              value={selectedAssigneeId}
              onChange={(e) => setSelectedAssigneeId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-[#0f365e]"
            >
              <option value={user?.id}>Direct Report to Me ({user?.name} - Manager)</option>
              {teamLeaders.map((tl) => (
                <option key={tl.id} value={tl.id}>
                  Assign to Team Leader: {tl.name} ({tl.designation || 'Team Leader'})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || allEmployees.length === 0}
              className="px-4 py-2 bg-[#0f365e] text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
