'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { fetchApi } from '@/lib/api';
import { Plus } from '@/components/ui/Icon';

export default function HROnboardingPage() {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Onboarding Task Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [title, setTitle] = useState('Engineering Onboarding Protocol');
  const [type, setType] = useState('onboarding');
  const [tasksInput, setTasksInput] = useState(
    'Set up corporate email & Slack, Submit identity & tax forms, Complete security compliance training, IT hardware allocation & badge'
  );
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [chkRes, empRes] = await Promise.all([
        fetchApi('/checklists').catch(() => ({ checklists: [] })),
        fetchApi('/employees').catch(() => ({ employees: [] })),
      ]);
      setChecklists(chkRes.checklists || []);
      setEmployees(empRes.employees || []);
      if (empRes.employees?.length > 0) {
        setSelectedUserId(empRes.employees[0].id.toString());
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to load onboarding workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const taskList = tasksInput
        .split(',')
        .map((t, idx) => t.trim())
        .filter((t) => t.length > 0)
        .map((t, idx) => ({
          id: idx + 1,
          text: t,
          completed: false,
        }));

      await fetchApi('/checklists', {
        method: 'POST',
        body: JSON.stringify({
          user_id: selectedUserId,
          title,
          type,
          items: taskList,
        }),
      });

      setToastMessage('Onboarding checklist protocol assigned successfully!');
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to assign onboarding task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PortalLayout namespace="hr">
      <PageHeader
        title="Onboarding & Offboarding Workflows"
        description="Employee onboarding task checklists, document submission progress, and offboarding clearance"
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Checklist Protocol</span>
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium">
            Fetching onboarding checklists from database...
          </div>
        ) : checklists.length === 0 ? (
          <div className="p-12 text-center rounded-xl">
            <p className="text-sm font-extrabold text-slate-800 mb-1">No Onboarding Checklists Assigned</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Click &quot;Create Checklist Protocol&quot; above to assign onboarding or offboarding tasks to employees.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#0f365e] text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Assign First Checklist
            </button>
          </div>
        ) : (
          <TablePrimitive
            headers={['Employee', 'Protocol Title', 'Type', 'Progress', 'Status']}
            rows={checklists.map((c) => {
              const items = c.items || [];
              const completedCount = items.filter((i: any) => i.completed).length;
              const pct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

              return [
                <div key="emp">
                  <p className="font-extrabold text-slate-900 text-xs">{c.user?.name || `Employee #${c.user_id}`}</p>
                  <p className="text-[10px] font-mono text-slate-400">{c.user?.employee_code || ''}</p>
                </div>,
                <span key="title" className="font-bold text-slate-800 text-xs">{c.title}</span>,
                <span key="type" className="capitalize text-xs text-slate-600 font-medium">{c.type}</span>,
                <div key="prog" className="w-full max-w-xs space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-600">
                    <span>{completedCount} / {items.length} tasks</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#0f365e] h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>,
                <Badge key="status" variant={c.status === 'completed' ? 'green' : 'yellow'}>
                  {c.status}
                </Badge>,
              ];
            })}
          />
        )}
      </div>

      {/* CREATE ONBOARDING CHECKLIST MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Assign Onboarding / Offboarding Protocol">
        <form onSubmit={handleCreateChecklist} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Employee</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employee_code || `EMP${emp.id}`}) - {emp.department}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Protocol Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="e.g. Engineering Onboarding Protocol"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Workflow Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              >
                <option value="onboarding">Onboarding</option>
                <option value="offboarding">Offboarding</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Task List (Comma separated)</label>
            <textarea
              required
              rows={4}
              value={tasksInput}
              onChange={(e) => setTasksInput(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs leading-relaxed"
              placeholder="Task 1, Task 2, Task 3..."
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Separate each task with a comma. Tasks will be assigned to the selected employee checklist.
            </p>
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
              disabled={submitting}
              className="px-4 py-2 bg-[#0f365e] text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Creating Protocol...' : 'Assign Protocol'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
