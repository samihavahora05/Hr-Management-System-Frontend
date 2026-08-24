'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { fetchApi } from '@/lib/api';
import { CreditCard, Plus } from '@/components/ui/Icon';

export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Loan Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('50000');
  const [tenure, setTenure] = useState('12');
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/loans');
      setLoans(res.loans || []);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/loans', {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(amount),
          tenure_months: parseInt(tenure),
          reason,
        }),
      });
      setToastMessage(res.message || 'Loan request submitted!');
      setIsModalOpen(false);
      setReason('');
      loadLoans();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to submit loan request');
    }
  };

  return (
    <PortalLayout namespace="employee">
      <PageHeader
        title="Employee Loans & Advances"
        description="Request interest-free company loans and advances with scheduled monthly repayment plans."
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Request Loan / Advance</span>
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium animate-pulse">Loading loan records...</div>
        ) : loans.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">No company loans or salary advance requests.</div>
        ) : (
          <TablePrimitive
            headers={['Employee', 'Loan Amount (₹)', 'Tenure', 'Monthly EMI (₹)', 'Outstanding (₹)', 'Status']}
            rows={loans.map((l) => [
              <span key="emp" className="font-extrabold text-slate-900 text-xs">{l.user?.name || 'Self'}</span>,
              <span key="amt" className="font-mono text-xs font-black text-slate-900">₹{l.amount}</span>,
              <span key="ten" className="font-mono text-xs text-slate-600 font-bold">{l.tenure_months} Months</span>,
              <span key="emi" className="font-mono text-xs text-blue-700 font-bold">₹{l.monthly_installment} / mo</span>,
              <span key="bal" className="font-mono text-xs text-amber-700 font-bold">₹{l.outstanding_balance}</span>,
              <Badge key="status" variant={l.status === 'approved' ? 'green' : 'amber'}>
                {l.status.toUpperCase()}
              </Badge>,
            ])}
          />
        )}
      </div>

      {/* CREATE LOAN MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Request Company Loan / Advance">
        <form onSubmit={handleCreateLoan} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Requested Loan Amount (₹)</label>
              <input
                type="number"
                required
                min="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tenure (Months)</label>
              <select
                value={tenure}
                onChange={(e) => setTenure(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-mono"
              >
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">12 Months</option>
                <option value="24">24 Months</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 font-medium">
            Estimated Monthly Deduction: <span className="font-bold font-mono">₹{Math.round(parseFloat(amount || '0') / parseInt(tenure || '1'))} / month</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Advance</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="Medical emergency, family expense, relocation, etc..."
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
              Submit Loan Request
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
