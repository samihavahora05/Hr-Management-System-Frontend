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
import { UserPlus, Download, Users, Search } from '@/components/ui/Icon';

export default function ManagerEmployeesPage() {
  const { user } = useAuth();
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [teamEmployees, setTeamEmployees] = useState<any[]>([]);
  const [unassignedEmployees, setUnassignedEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [viewMode, setViewMode] = useState<'all' | 'team'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  // Add Team Member Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allRes, teamRes] = await Promise.all([
        fetchApi('/employees?all=true').catch(() => ({ employees: [] })),
        fetchApi('/employees?team_only=true').catch(() => ({ employees: [] })),
      ]);

      const orgEmps = allRes.employees || [];
      const directTeam = teamRes.employees || [];

      setAllEmployees(orgEmps);
      setTeamEmployees(directTeam);

      const available = orgEmps.filter(
        (emp: any) => emp.manager_id !== user?.id && emp.id !== user?.id
      );
      setUnassignedEmployees(available);
      if (available.length > 0) {
        setSelectedEmpId(available[0].id.toString());
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to load employees directory');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !user) return;
    setSubmitting(true);

    try {
      await fetchApi(`/employees/${selectedEmpId}`, {
        method: 'PUT',
        body: JSON.stringify({ manager_id: user.id }),
      });

      setToastMessage('New employee added to your management team successfully!');
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to assign employee');
    } finally {
      setSubmitting(false);
    }
  };

  const activeList = viewMode === 'all' ? allEmployees : teamEmployees;

  // Filtered employees list
  const departmentsList = Array.from(new Set(allEmployees.map((e) => e.department))).filter(Boolean);

  const filteredEmployees = activeList.filter((m) => {
    if (selectedDept !== 'all' && (m.department || '').toLowerCase() !== selectedDept.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (m.name || '').toLowerCase().includes(q);
      const matchEmail = (m.email || '').toLowerCase().includes(q);
      const matchCode = (m.employee_code || '').toLowerCase().includes(q);
      const matchDes = (m.designation || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchCode && !matchDes) return false;
    }
    return true;
  });

  const handleExportExcel = () => {
    if (filteredEmployees.length === 0) {
      setToastMessage('No employee data available to export.');
      return;
    }
    const headers = ['Employee Name', 'Employee Code', 'Email', 'Designation', 'Department', 'Status'];
    const rows = filteredEmployees.map((m) => [
      m.name,
      m.employee_code || `EMP00${m.id}`,
      m.email,
      m.designation || 'Staff',
      m.department || 'N/A',
      m.status || 'active',
    ]);
    exportToCSV(`Manager_Employees_Roster_${viewMode.toUpperCase()}`, headers, rows);
    setToastMessage('Employee directory exported to CSV successfully!');
  };

  return (
    <PortalLayout namespace="manager">
      <PageHeader
        title="Employees Directory & Roster"
        description="Full organization employee directory, reporting structures, designations, and department rosters"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              title="Export employee directory to Excel CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export to Excel</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Assign Employee</span>
            </button>
          </div>
        }
      />

      <div className="space-y-4">
        {/* INTERACTIVE CONTROLS: TABS & FILTERS */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setViewMode('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'all' ? 'bg-[#0f365e] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Employees ({allEmployees.length})
            </button>
            <button
              onClick={() => setViewMode('team')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'team' ? 'bg-[#0f365e] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Direct Team ({teamEmployees.length})
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0f365e]"
              />
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer focus:bg-white focus:outline-hidden"
            >
              <option value="all">All Departments</option>
              {departmentsList.map((d: any) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* EMPLOYEES TABLE */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">
              Fetching organization employees directory...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-12 text-center rounded-xl">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-extrabold text-slate-800 mb-1">No Employees Found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No employee records match your selected search or filter criteria.
              </p>
            </div>
          ) : (
            <TablePrimitive
              headers={['Employee', 'Employee Code', 'Designation', 'Department', 'Reporting Manager', 'Status']}
              rows={filteredEmployees.map((m) => [
                <div key="emp">
                  <p className="font-extrabold text-slate-900 text-xs">
                    {m.name} {m.id === user?.id && <span className="text-[10px] text-sky-700 font-bold">(You - Manager)</span>}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400">{m.email}</p>
                </div>,
                <span key="code" className="font-mono text-xs text-[#0f365e] font-bold">{m.employee_code || `EMP00${m.id}`}</span>,
                <span key="des" className="text-xs text-slate-700">{m.designation || 'Staff'}</span>,
                <span key="dept" className="text-xs text-slate-700 font-medium">{m.department || 'Corporate'}</span>,
                <span key="mgr" className="text-xs text-slate-600 font-medium">
                  {m.manager?.name ? m.manager.name : m.id === user?.id ? 'Executive Board' : 'Unassigned'}
                </span>,
                <Badge key="status" variant={m.status === 'active' ? 'green' : m.status === 'on_leave' ? 'yellow' : 'red'}>
                  {m.status || 'active'}
                </Badge>,
              ])}
            />
          )}
        </div>
      </div>

      {/* ASSIGN EMPLOYEE MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Assign Employee to Management Team">
        <form onSubmit={handleAssignTeamMember} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Organization Employee</label>
            {unassignedEmployees.length === 0 ? (
              <p className="text-xs text-slate-500 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                All organization employees are already assigned to your reporting team.
              </p>
            ) : (
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                {unassignedEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employee_code || `EMP${emp.id}`}) - {emp.designation || 'Staff'} ({emp.department || 'Corporate'})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || unassignedEmployees.length === 0}
              className="px-4 py-2 bg-[#0f365e] text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Assigning...' : 'Assign to My Team'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
