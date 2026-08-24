'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { fetchApi } from '@/lib/api';
import { HelpCircle, Plus } from '@/components/ui/Icon';

export default function HelpdeskPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Ticket Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState('General HR Query');
  const [priority, setPriority] = useState('medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/helpdesk');
      setTickets(res.tickets || []);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/helpdesk', {
        method: 'POST',
        body: JSON.stringify({
          category,
          priority,
          subject,
          description,
        }),
      });
      setToastMessage(res.message || 'Ticket raised successfully!');
      setIsModalOpen(false);
      setSubject('');
      setDescription('');
      loadTickets();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to raise ticket');
    }
  };

  return (
    <PortalLayout namespace="employee">
      <PageHeader
        title="HR & Operations Helpdesk"
        description="Raise employee support requests for profile updates, document requests, and HR policy queries."
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Raise HR Ticket</span>
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium animate-pulse">Loading helpdesk tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">No helpdesk tickets raised yet.</div>
        ) : (
          <TablePrimitive
            headers={['Ticket #', 'Subject', 'Category', 'Priority', 'Status', 'Date Raised']}
            rows={tickets.map((t) => [
              <span key="id" className="font-mono font-bold text-xs text-[#0f365e]">#{t.id}</span>,
              <span key="sub" className="font-bold text-xs text-slate-800">{t.subject}</span>,
              <span key="cat" className="text-xs text-slate-600 font-medium">{t.category}</span>,
              <Badge key="pri" variant={t.priority === 'urgent' ? 'red' : t.priority === 'high' ? 'yellow' : 'blue'}>
                {t.priority}
              </Badge>,
              <Badge key="st" variant={t.status === 'open' ? 'yellow' : t.status === 'in_progress' ? 'blue' : 'green'}>
                {t.status.replace('_', ' ')}
              </Badge>,
              <span key="dt" className="text-xs font-mono text-slate-500">{t.created_at?.split('T')[0] || 'Today'}</span>,
            ])}
          />
        )}
      </div>

      {/* CREATE TICKET MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Raise Helpdesk Support Ticket">
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ticket Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="General HR Query">General HR Query</option>
                <option value="Profile Change">Profile / Address Change</option>
                <option value="Document Request">Experience / Verification Certificate</option>
                <option value="Leave Policy">Leave & Attendance Policy</option>
                <option value="IT Support">IT & Laptop Access</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">SLA Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="Summary of request..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Explanation</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="Provide complete details for HR processing..."
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
              Submit Ticket
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
