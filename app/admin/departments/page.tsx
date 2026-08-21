'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { fetchApi } from '@/lib/api';
import { Plus, Building2 } from '@/components/ui/Icon';

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Department Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/departments');
      setDepartments(res.by_department || []);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to load department structure');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const trimmed = deptName.trim();
      if (!trimmed) return;

      const res = await fetchApi('/departments', {
        method: 'POST',
        body: JSON.stringify({ name: trimmed }),
      });

      setToastMessage(res.message || `Department "${trimmed}" created and saved to database successfully!`);
      setIsModalOpen(false);
      setDeptName('');
      await loadDepartments();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to create department');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PortalLayout namespace="admin">
      <PageHeader
        title="Admin Department Management"
        description="Create organization departments that automatically populate in the New User department selection list"
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Department</span>
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium animate-pulse">
            Fetching organization department records from database...
          </div>
        ) : departments.length === 0 ? (
          <div className="p-12 text-center rounded-xl">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-extrabold text-slate-800 mb-1">No Departments Configured</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Click &quot;Create New Department&quot; above to create department structures for your organization.
            </p>
          </div>
        ) : (
          <TablePrimitive
            headers={['Department Name', 'Active Headcount', 'Workforce Share']}
            rows={departments.map((d) => {
              const count = d.count || 0;
              return [
                <span key="name" className="font-extrabold text-slate-900 text-xs">{d.department || 'General'}</span>,
                <span key="count" className="font-mono font-bold text-[#0f365e] text-xs">{count} {count === 1 ? 'Member' : 'Members'}</span>,
                <div key="share" className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden max-w-xs">
                  <div className="bg-[#0f365e] h-full rounded-full" style={{ width: `${Math.min(100, count * 20)}%` }} />
                </div>,
              ];
            })}
          />
        )}
      </div>

      {/* ADD DEPARTMENT MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Department (Saves to DB)">
        <form onSubmit={handleAddDepartment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Department Name</label>
            <input
              type="text"
              required
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="e.g. Quality Assurance, Cloud Infrastructure, Security"
            />
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
              disabled={submitting}
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Saving Department...' : 'Save Department'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
