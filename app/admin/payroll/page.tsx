'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { fetchApi } from '@/lib/api';
import { CreditCard, Plus, Download } from '@/components/ui/Icon';

export default function AdminPayrollPage() {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Generate Payroll Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [monthYear, setMonthYear] = useState('2026-08');

  useEffect(() => {
    loadPayroll();
  }, []);

  const loadPayroll = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/payroll');
      setPayrolls(res.payrolls || []);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to load payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/payroll/generate', {
        method: 'POST',
        body: JSON.stringify({ month_year: monthYear }),
      });
      setToastMessage(res.message || 'Payroll generated successfully!');
      setIsModalOpen(false);
      loadPayroll();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to generate payroll');
    }
  };

  return (
    <PortalLayout namespace="admin">
      <PageHeader
        title="Statutory Payroll & Tax Administration"
        description="Run monthly statutory payroll calculations (PF, ESI, Professional Tax, TDS), approve disbursements, and publish payslips."
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Run Monthly Payroll</span>
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium animate-pulse">Loading payroll records...</div>
        ) : payrolls.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">No payroll runs found in database.</div>
        ) : (
          <TablePrimitive
            headers={['Employee Name', 'Month', 'Gross Salary (₹)', 'Statutory Deductions (₹)', 'Net Salary (₹)', 'Status']}
            rows={payrolls.map((p) => [
              <div key="emp" className="flex flex-col">
                <span className="font-extrabold text-slate-900 text-xs">{p.user?.name || 'Employee'}</span>
                <span className="text-[10px] text-slate-500">{p.user?.employee_code}</span>
              </div>,
              <span key="month" className="font-mono text-xs text-slate-700 font-bold">{p.month_year}</span>,
              <span key="gross" className="font-mono text-xs font-bold text-slate-900">₹{p.gross_salary}</span>,
              <span key="ded" className="font-mono text-xs text-rose-600 font-bold">₹{p.total_deductions}</span>,
              <span key="net" className="font-mono text-xs font-black text-emerald-700">₹{p.net_salary}</span>,
              <Badge key="status" variant={p.status === 'paid' ? 'green' : 'blue'}>
                {p.status.toUpperCase()}
              </Badge>,
            ])}
          />
        )}
      </div>

      {/* GENERATE PAYROLL MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Run Monthly Statutory Payroll">
        <form onSubmit={handleGeneratePayroll} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Payroll Month (YYYY-MM)</label>
            <input
              type="text"
              required
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              placeholder="2026-08"
            />
          </div>

          <p className="text-[11px] text-slate-500">
            This will calculate statutory Provident Fund (12%), Employee State Insurance (ESI), Professional Tax (PT), and TDS tax regime deductions for all active employees.
          </p>

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
              Execute Payroll Run
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
