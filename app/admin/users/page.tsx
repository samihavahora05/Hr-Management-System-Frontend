'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { fetchApi } from '@/lib/api';
import { exportToCSV } from '@/lib/export';
import { UserPlus, Download, Trash2, ShieldCheck, Eye, EyeOff } from '@/components/ui/Icon';

const DEFAULT_COMPANY_DEPARTMENTS = [
  'Engineering',
  'Human Resources',
  'Product Management',
  'Marketing',
  'Finance',
  'Executive',
  'Sales',
  'Legal & Compliance',
  'Customer Success',
  'Operations',
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [companyDepartments, setCompanyDepartments] = useState<string[]>(DEFAULT_COMPANY_DEPARTMENTS);
  const [managersList, setManagersList] = useState<any[]>([]);
  const [shiftsList, setShiftsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add User modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('employee');
  const [department, setDepartment] = useState('Engineering');
  const [designation, setDesignation] = useState('Software Developer');
  const [joiningDate, setJoiningDate] = useState('2026-08-19');
  const [baseSalary, setBaseSalary] = useState('75000');
  const [phone, setPhone] = useState('');
  const [managerId, setManagerId] = useState<string | number>('');
  const [shiftId, setShiftId] = useState<string | number>('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Shift timing customizer modal state
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [newShiftName, setNewShiftName] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:30');
  const [newEndTime, setNewEndTime] = useState('18:30');
  const [newGracePeriod, setNewGracePeriod] = useState('15');

  useEffect(() => {
    loadUsers();
    loadCompanyDepartments();
    loadShifts();
  }, []);

  const loadShifts = async () => {
    try {
      const res = await fetchApi('/shifts');
      if (res.shifts && Array.isArray(res.shifts)) {
        setShiftsList(res.shifts);
        if (res.shifts.length > 0 && !shiftId) {
          setShiftId(res.shifts[0].id);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/shifts', {
        method: 'POST',
        body: JSON.stringify({
          name: newShiftName,
          start_time: newStartTime.length === 5 ? newStartTime + ':00' : newStartTime,
          end_time: newEndTime.length === 5 ? newEndTime + ':00' : newEndTime,
          grace_period_minutes: Number(newGracePeriod),
        }),
      });
      setToastMessage('Custom work shift created! Assigned to company shift options.');
      setIsShiftModalOpen(false);
      setNewShiftName('');
      await loadShifts();
      if (res.shift?.id) {
        setShiftId(res.shift.id);
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to create custom shift');
    }
  };

  const loadCompanyDepartments = async () => {
    try {
      const res = await fetchApi('/departments');
      if (res.departments && Array.isArray(res.departments)) {
        setCompanyDepartments(res.departments);
      }
    } catch (e) {
      // Use default list if error
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/employees');
      const allUsers = res.employees || [];
      setUsers(allUsers);
      // Filter potential managers for reporting structure
      setManagersList(allUsers.filter((u: any) => ['admin', 'hr', 'manager', 'company_manager', 'team_leader'].includes(u.role?.name?.toLowerCase())));
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to load user accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetchApi('/employees', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password: password || undefined,
          role,
          department,
          designation,
          joining_date: joiningDate,
          base_salary: baseSalary,
          phone,
          manager_id: managerId ? Number(managerId) : null,
          shift_id: shiftId ? Number(shiftId) : null,
        }),
      });

      setToastMessage(`New ${role} user account created successfully with assigned credentials!`);
      setIsAddModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setPhone('');
      setManagerId('');
      await loadUsers();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to create user account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userObj: any) => {
    if (userObj.role?.name === 'admin' || userObj.email === 'admin@blueboxx.com') {
      setToastMessage('The Primary Admin account is permanent and cannot be removed.');
      return;
    }

    if (!confirm(`Are you sure you want to remove user "${userObj.name}"? This action will permanently remove the user from the database.`)) {
      return;
    }

    setDeletingId(userObj.id);
    try {
      const res = await fetchApi(`/employees/${userObj.id}`, {
        method: 'DELETE',
      });
      setToastMessage(res.message || `User ${userObj.name} removed successfully.`);
      await loadUsers();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to remove user account');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportExcel = () => {
    if (users.length === 0) {
      setToastMessage('No user accounts available to export.');
      return;
    }
    const headers = ['Name', 'Code', 'Email', 'Role', 'Department', 'Designation', 'Joining Date', 'Status', 'Phone'];
    const data = users.map((u) => [
      u.name,
      u.employee_code || '',
      u.email,
      u.role?.display_name || u.role?.name || 'Employee',
      u.department || 'N/A',
      u.designation || 'Staff',
      u.joining_date || '',
      u.status || 'active',
      u.phone || '',
    ]);
    exportToCSV('blueboxx_user_directory', headers, data);
    setToastMessage('User directory exported successfully!');
  };

  return (
    <PortalLayout namespace="admin">
      <PageHeader
        title="User Account Management"
        description="Create, assign roles, manage reporting structure, and configure user accounts in system database"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="py-2 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export to Excel</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="py-2 px-3.5 bg-[#0f365e] hover:bg-[#164677] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New User</span>
            </button>
          </div>
        }
      />

      <div className="bg-white border border-[#c3c6cf] rounded-2xl p-5 shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">
            Loading user accounts from organization directory...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">
            No user accounts found in organization database.
          </div>
        ) : (
          <TablePrimitive
            headers={['User', 'Email', 'Role', 'Department', 'Manager', 'Status', 'Action']}
            rows={users.map((u) => {
              const isAdmin = u.role?.name === 'admin' || u.email === 'admin@blueboxx.com';
              return [
                <div key={u.id}>
                  <div className="font-bold text-slate-900">{u.name}</div>
                  <div className="text-[10px] font-mono text-slate-400">{u.employee_code || ''} • {u.designation || 'Staff'}</div>
                </div>,
                <span key="email" className="font-mono text-xs text-slate-600">{u.email}</span>,
                <Badge key="role" variant={u.role?.name === 'admin' ? 'purple' : u.role?.name === 'hr' ? 'blue' : u.role?.name === 'manager' ? 'yellow' : u.role?.name === 'team_leader' ? 'sky' : 'gray'}>
                  {u.role?.display_name || u.role?.name || 'Employee'}
                </Badge>,
                u.department || 'N/A',
                u.manager?.name || 'Top-Level Admin',
                <Badge key="status" variant={u.status === 'active' ? 'green' : 'red'}>
                  {u.status}
                </Badge>,
                isAdmin ? (
                  <span
                    key="protected"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold select-none"
                    title="Permanent Master Admin Account"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Permanent</span>
                  </span>
                ) : (
                  <button
                    key="delete"
                    onClick={() => handleDeleteUser(u)}
                    disabled={deletingId === u.id}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    title="Remove user account from database"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                ),
              ];
            })}
          />
        )}
      </div>

      {/* ADD USER MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setShowPassword(false); }} title="Create New User Account (Stores in DB)">
        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="e.g. Vikram Singh"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="user@blueboxx.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-xs"
                  placeholder="Assign password (min 6 chars)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer select-none"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white"
              >
                <option value="employee">Employee</option>
                <option value="team_leader">Team Leader</option>
                <option value="manager">Company Manager</option>
                <option value="hr">HR Specialist</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                {companyDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reporting Manager</label>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="">None (Top-Level / Admin Direct)</option>
                {managersList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role?.display_name || m.role?.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Joining Date</label>
              <input
                type="date"
                required
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Assigned Work Shift Timing</label>
                <button
                  type="button"
                  onClick={() => setIsShiftModalOpen(true)}
                  className="text-[11px] font-extrabold text-[#0f365e] hover:underline cursor-pointer"
                >
                  + Add Custom Shift
                </button>
              </div>
              <select
                value={shiftId}
                onChange={(e) => setShiftId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-bold text-[#0f365e]"
              >
                {shiftsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Creating User...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CREATE CUSTOM SHIFT MODAL */}
      <Modal isOpen={isShiftModalOpen} onClose={() => setIsShiftModalOpen(false)} title="Customize Company Work Shift Timing">
        <form onSubmit={handleCreateShift} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Shift Name / Title</label>
            <input
              type="text"
              required
              value={newShiftName}
              onChange={(e) => setNewShiftName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="e.g. Flexible Morning / UK Shift / Shift A"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Shift Start Time</label>
              <input
                type="time"
                required
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Shift End Time</label>
              <input
                type="time"
                required
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Grace Period (Minutes)</label>
            <input
              type="number"
              required
              min="0"
              max="60"
              value={newGracePeriod}
              onChange={(e) => setNewGracePeriod(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              placeholder="15"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Clock-ins within {newGracePeriod || 15} minutes after shift start time receive On-Time (Green) status.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsShiftModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
            >
              Save Custom Shift
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
