'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/lib/auth-context';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { fetchApi } from '@/lib/api';
import { Edit } from '@/components/ui/Icon';

export default function EmployeeProfilePage() {
  const { user, refreshUser, login } = useAuth();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    refreshUser();
  }, []);

  const openEditModal = () => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setDepartment(user.department || '');
      setDesignation(user.designation || '');
      setJoiningDate(user.joining_date ? String(user.joining_date).split('T')[0].split(' ')[0] : '');
    }
    setIsEditModalOpen(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetchApi('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          department: department.trim(),
          designation: designation.trim(),
          joining_date: joiningDate || null,
        }),
      });

      const token = localStorage.getItem('token');
      if (token && res.user) {
        login(token, res.user);
      }
      await refreshUser();
      setToastMessage('Profile updated and saved successfully!');
      setIsEditModalOpen(false);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const formatJoiningDate = (dateVal?: string | null) => {
    if (!dateVal) return 'N/A';
    const clean = String(dateVal).split('T')[0].split(' ')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }
    return clean;
  };

  return (
    <PortalLayout namespace="employee">
      <PageHeader
        title="My Employee Profile"
        description="Personal details, employment parameters, department alignment, and contact information"
        action={
          <button
            onClick={openEditModal}
            className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#0f365e] text-white font-extrabold text-2xl flex items-center justify-center shadow-md shrink-0">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">{user?.name}</h2>
              <p className="text-xs font-mono font-bold text-[#0f365e]">{user?.employee_code || 'N/A'}</p>
              <p className="text-xs text-slate-500 capitalize mt-0.5">{user?.designation || user?.role_display || 'Staff'} | {user?.department || 'General'}</p>
            </div>
          </div>

          <button
            onClick={openEditModal}
            className="self-start sm:self-center px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Email Address</label>
            <p className="font-mono text-sm text-slate-900 font-semibold">{user?.email}</p>
          </div>
          <div>
            <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Phone Number</label>
            <p className="text-sm text-slate-900 font-semibold">{user?.phone || 'N/A'}</p>
          </div>
          <div>
            <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Department</label>
            <p className="text-sm text-slate-900 font-semibold">{user?.department || 'General'}</p>
          </div>
          <div>
            <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Designation</label>
            <p className="text-sm text-slate-900 font-semibold">{user?.designation || user?.role_display || 'Staff'}</p>
          </div>
          <div>
            <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Joining Date</label>
            <p className="text-sm text-slate-900 font-semibold">
              {user?.joining_date ? formatJoiningDate(user.joining_date) : 'N/A'}
              {user?.joining_date && (
                <span className="text-xs text-slate-400 font-mono ml-2 font-normal">
                  ({String(user.joining_date).split('T')[0].split(' ')[0]})
                </span>
              )}
            </p>
          </div>
          <div>
            <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Employment Status</label>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold capitalize">
              {user?.status || 'Active'}
            </span>
          </div>
          {user?.manager_name && (
            <div>
              <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Reporting Manager</label>
              <p className="text-sm text-slate-900 font-semibold">{user.manager_name}</p>
            </div>
          )}
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit My Profile">
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="e.g. john@blueboxx.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Joining Date</label>
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="e.g. Engineering, Sales"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="e.g. Senior Frontend Developer"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
