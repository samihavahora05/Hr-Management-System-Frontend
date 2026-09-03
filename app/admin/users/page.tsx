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
import { UserPlus, Download, Trash2, ShieldCheck, Eye, EyeOff, Edit, CheckSquare } from '@/components/ui/Icon';

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

function format12Hour(timeStr?: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }
  return timeStr;
}

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
  const [joiningDate, setJoiningDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [baseSalary, setBaseSalary] = useState('75000');
  const [phone, setPhone] = useState('');
  const [managerId, setManagerId] = useState<string | number>('');
  const [shiftId, setShiftId] = useState<string | number>('');
  const [shiftStartTime, setShiftStartTime] = useState('10:00');
  const [shiftEndTime, setShiftEndTime] = useState('18:00');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit User modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editShowPassword, setEditShowPassword] = useState(false);
  const [editRole, setEditRole] = useState('employee');
  const [editDepartment, setEditDepartment] = useState('Engineering');
  const [editDesignation, setEditDesignation] = useState('Software Developer');
  const [editJoiningDate, setEditJoiningDate] = useState('');
  const [editBaseSalary, setEditBaseSalary] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editManagerId, setEditManagerId] = useState<string | number>('');
  const [editShiftId, setEditShiftId] = useState<string | number>('');
  const [editShiftStartTime, setEditShiftStartTime] = useState('10:00');
  const [editShiftEndTime, setEditShiftEndTime] = useState('18:00');
  const [editStatus, setEditStatus] = useState('active');
  const [editSubmitting, setEditSubmitting] = useState(false);

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
          if (res.shifts[0].start_time) setShiftStartTime(res.shifts[0].start_time.slice(0, 5));
          if (res.shifts[0].end_time) setShiftEndTime(res.shifts[0].end_time.slice(0, 5));
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const handleShiftChange = (sId: string) => {
    setShiftId(sId);
    const found = shiftsList.find((s) => String(s.id) === String(sId));
    if (found) {
      if (found.start_time) setShiftStartTime(found.start_time.slice(0, 5));
      if (found.end_time) setShiftEndTime(found.end_time.slice(0, 5));
    }
  };

  const handleEditShiftChange = (sId: string) => {
    setEditShiftId(sId);
    const found = shiftsList.find((s) => String(s.id) === String(sId));
    if (found) {
      if (found.start_time) setEditShiftStartTime(found.start_time.slice(0, 5));
      if (found.end_time) setEditShiftEndTime(found.end_time.slice(0, 5));
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
          shift_id: shiftId && shiftId !== 'custom' ? Number(shiftId) : null,
          shift_start_time: shiftStartTime,
          shift_end_time: shiftEndTime,
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

  const openEditModal = (u: any) => {
    setEditingUserId(u.id);
    setEditName(u.name || '');
    setEditEmail(u.email || '');
    setEditPassword('');
    setEditShowPassword(false);
    setEditRole(u.role?.name || 'employee');
    setEditDepartment(u.department || 'Engineering');
    setEditDesignation(u.designation || 'Staff');
    setEditJoiningDate(u.joining_date ? String(u.joining_date).slice(0, 10) : new Date().toISOString().slice(0, 10));
    setEditBaseSalary(u.base_salary ? String(u.base_salary) : '75000');
    setEditPhone(u.phone || '');
    setEditManagerId(u.manager_id || '');
    const userShift = u.shift || shiftsList.find((s) => s.id === u.shift_id) || shiftsList[0];
    setEditShiftId(u.shift_id || (shiftsList[0]?.id ?? ''));
    setEditShiftStartTime(userShift?.start_time ? userShift.start_time.slice(0, 5) : '10:00');
    setEditShiftEndTime(userShift?.end_time ? userShift.end_time.slice(0, 5) : '18:00');
    setEditStatus(u.status || 'active');
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    setEditSubmitting(true);
    try {
      await fetchApi(`/employees/${editingUserId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          password: editPassword || undefined,
          role: editRole,
          department: editDepartment,
          designation: editDesignation,
          joining_date: editJoiningDate,
          base_salary: editBaseSalary,
          phone: editPhone,
          manager_id: editManagerId ? Number(editManagerId) : null,
          shift_id: editShiftId && editShiftId !== 'custom' ? Number(editShiftId) : null,
          shift_start_time: editShiftStartTime,
          shift_end_time: editShiftEndTime,
          status: editStatus,
        }),
      });

      setToastMessage(`User account for "${editName}" updated successfully!`);
      setIsEditModalOpen(false);
      setEditingUserId(null);
      await loadUsers();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to update user account');
    } finally {
      setEditSubmitting(false);
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
            headers={['User', 'Email', 'Role', 'Department', 'Shift / Timings', 'Manager', 'Status', 'Action']}
            rows={users.map((u) => {
              const isAdmin = u.role?.name === 'admin' || u.email === 'admin@blueboxx.com';
              const uShift = u.shift || shiftsList.find((s) => s.id === u.shift_id);
              const shiftTimeLabel = uShift?.start_time && uShift?.end_time
                ? `${uShift.start_time.slice(0, 5)} - ${uShift.end_time.slice(0, 5)}`
                : '10:00 - 18:00';

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
                <div key="shift" className="text-xs">
                  <div className="font-semibold text-slate-800">{uShift?.name || 'General Shift'}</div>
                  <div className="text-[11px] font-mono text-indigo-600 font-medium">{shiftTimeLabel}</div>
                </div>,
                u.manager?.name || 'Top-Level Admin',
                <Badge key="status" variant={u.status === 'active' ? 'green' : 'red'}>
                  {u.status}
                </Badge>,
                <div key={u.id + '-actions'} className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(u)}
                    className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 hover:text-sky-900 border border-sky-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    title="Edit user details"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  {isAdmin ? (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold select-none"
                      title="Permanent Master Admin Account"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Permanent</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleDeleteUser(u)}
                      disabled={deletingId === u.id}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Remove user account from database"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
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

          {/* Shift & Working Hours */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-800">
                  Assigned Work Shift & Office Timings
                </label>
                <p className="text-[11px] text-slate-500">
                  Select a template or set custom office in/out times
                </p>
              </div>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                Auto Checkout: {format12Hour(shiftEndTime)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Shift Preset</span>
                <select
                  value={shiftId}
                  onChange={(e) => handleShiftChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-bold text-[#0f365e]"
                >
                  <option value="custom">⚙️ Custom / Individual Timing</option>
                  {shiftsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Office In Time (Start)</span>
                <input
                  type="time"
                  required
                  value={shiftStartTime}
                  onChange={(e) => setShiftStartTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Office Out / Auto Checkout</span>
                <input
                  type="time"
                  required
                  value={shiftEndTime}
                  onChange={(e) => setShiftEndTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono font-bold text-slate-800"
                />
              </div>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="+91 98765 43210"
              />
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

      {/* EDIT USER MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditShowPassword(false); }} title="Edit User Account Details">
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="e.g. Vikram Singh"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="user@blueboxx.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reset Password (Optional)</label>
              <div className="relative">
                <input
                  type={editShowPassword ? 'text' : 'password'}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-xs"
                  placeholder="Leave blank to keep current password"
                />
                <button
                  type="button"
                  onClick={() => setEditShowPassword(!editShowPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer select-none"
                  title={editShowPassword ? 'Hide password' : 'Show password'}
                >
                  {editShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Role</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white"
              >
                <option value="employee">Employee</option>
                <option value="team_leader">Team Leader</option>
                <option value="manager">Company Manager</option>
                <option value="hr">HR Specialist</option>
                <option value="admin">Master Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
              <select
                value={editDepartment}
                onChange={(e) => setEditDepartment(e.target.value)}
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
                value={editDesignation}
                onChange={(e) => setEditDesignation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-bold capitalize"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reporting Manager</label>
              <select
                value={editManagerId}
                onChange={(e) => setEditManagerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="">None (Top-Level / Admin Direct)</option>
                {managersList
                  .filter((m) => m.id !== editingUserId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role?.display_name || m.role?.name})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Joining Date</label>
              <input
                type="date"
                value={editJoiningDate}
                onChange={(e) => setEditJoiningDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="+91 98765 43210"
            />
          </div>

          {/* Work Shift & Office Timings */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-800">
                  Assigned Work Shift & Office Timings
                </label>
                <p className="text-[11px] text-slate-500">
                  Select a template or set custom office in/out times
                </p>
              </div>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                Auto Checkout: {format12Hour(editShiftEndTime)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Shift Preset</span>
                <select
                  value={editShiftId}
                  onChange={(e) => handleEditShiftChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-bold text-[#0f365e]"
                >
                  <option value="custom">⚙️ Custom / Individual Timing</option>
                  {shiftsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Office In Time (Start)</span>
                <input
                  type="time"
                  required
                  value={editShiftStartTime}
                  onChange={(e) => setEditShiftStartTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Office Out / Auto Checkout</span>
                <input
                  type="time"
                  required
                  value={editShiftEndTime}
                  onChange={(e) => setEditShiftEndTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editSubmitting}
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckSquare className="w-4 h-4" />
              <span>{editSubmitting ? 'Saving Changes...' : 'Save User Changes'}</span>
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
