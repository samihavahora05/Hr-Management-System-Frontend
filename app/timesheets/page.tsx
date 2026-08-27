'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { fetchApi } from '@/lib/api';
import { Clock, Plus } from '@/components/ui/Icon';

export default function TimesheetsPage() {
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Timesheet Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [projectName, setProjectName] = useState('HRMS Platform');
  const [taskDescription, setTaskDescription] = useState('');
  const [hours, setHours] = useState('8');
  const [billable, setBillable] = useState(true);

  useEffect(() => {
    loadTimesheets();
  }, []);

  const loadTimesheets = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/timesheets');
      setTimesheets(res.timesheets || []);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to load timesheets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTimesheet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/timesheets', {
        method: 'POST',
        body: JSON.stringify({
          date,
          project_name: projectName,
          task_description: taskDescription,
          hours: parseFloat(hours),
          billable,
        }),
      });
      setToastMessage(res.message || 'Timesheet logged successfully!');
      setIsModalOpen(false);
      setTaskDescription('');
      loadTimesheets();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to log timesheet');
    }
  };

  return (
    <PortalLayout namespace="employee">
      <PageHeader
        title="Project Timesheets & Work Hours"
        description="Daily billable/non-billable task hours logging, client project allocation, and manager approval."
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Daily Hours</span>
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium animate-pulse">Loading project timesheets...</div>
        ) : timesheets.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">No project timesheets logged.</div>
        ) : (
          <TablePrimitive
            headers={['Date', 'Employee', 'Project Name', 'Logged Hours', 'Billable', 'Task Notes', 'Status']}
            rows={timesheets.map((t) => [
              <span key="date" className="font-mono text-xs text-slate-700 font-bold">{t.date}</span>,
              <span key="user" className="font-extrabold text-slate-900 text-xs">{t.user?.name || 'Self'}</span>,
              <span key="proj" className="font-bold text-xs text-slate-800">{t.project_name}</span>,
              <span key="hrs" className="font-mono text-xs font-black text-[#0f365e]">{t.hours} hrs</span>,
              <Badge key="bill" variant={t.billable ? 'blue' : 'neutral'}>
                {t.billable ? 'Billable' : 'Internal'}
              </Badge>,
              <span key="notes" className="text-xs text-slate-600 truncate max-w-xs">{t.task_description}</span>,
              <Badge key="status" variant={t.status === 'approved' ? 'green' : 'amber'}>
                {t.status.toUpperCase()}
              </Badge>,
            ])}
          />
        )}
      </div>

      {/* CREATE TIMESHEET MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Daily Timesheet Hours">
        <form onSubmit={handleCreateTimesheet} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Work Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Project Name</label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Logged Hours</label>
              <input
                type="number"
                required
                step="0.5"
                min="0.5"
                max="24"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Classification</label>
              <select
                value={billable ? 'true' : 'false'}
                onChange={(e) => setBillable(e.target.value === 'true')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="true">Client Billable</option>
                <option value="false">Non-Billable / Internal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Task Work Summary</label>
            <textarea
              required
              rows={3}
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="Describe tasks completed during logged hours..."
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
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
            >
              Save Timesheet
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
