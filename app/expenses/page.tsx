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
import { DollarSign, Plus, CheckCircle, XCircle, Clock, FileText, Check, X } from '@/components/ui/Icon';

export default function ExpensesPage() {
  const { user } = useAuth();
  const userRole = (typeof user?.role === 'object' ? (user.role as any)?.name : user?.role || '').toString().toLowerCase();
  const canApprove = userRole === 'admin';

  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Rejection Modal State
  const [rejectingClaimId, setRejectingClaimId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Claim Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState('Travel');
  const [amount, setAmount] = useState('');
  const [claimDate, setClaimDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/expenses');
      setClaims(res.claims || []);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to load expense claims');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category,
          amount: parseFloat(amount),
          claim_date: claimDate,
          description,
        }),
      });
      setToastMessage(res.message || 'Expense claim submitted successfully!');
      setIsModalOpen(false);
      setAmount('');
      setDescription('');
      loadClaims();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to submit claim');
    }
  };

  const handleApprove = async (claimId: number) => {
    setActionLoadingId(claimId);
    try {
      const res = await fetchApi(`/expenses/${claimId}/approve`, {
        method: 'POST',
      });
      setToastMessage(res.message || 'Expense claim approved!');
      setClaims((prev) =>
        prev.map((c) => (c.id === claimId ? { ...c, status: 'approved', approver: { name: user?.name } } : c))
      );
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to approve claim');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingClaimId) return;

    setActionLoadingId(rejectingClaimId);
    try {
      const res = await fetchApi(`/expenses/${rejectingClaimId}/reject`, {
        method: 'POST',
        body: JSON.stringify({
          rejection_reason: rejectionReason || 'Declined by management',
        }),
      });
      setToastMessage(res.message || 'Expense claim rejected');
      setClaims((prev) =>
        prev.map((c) =>
          c.id === rejectingClaimId
            ? {
                ...c,
                status: 'rejected',
                approver: { name: user?.name },
                rejection_reason: rejectionReason || 'Declined by management',
              }
            : c
        )
      );
      setRejectingClaimId(null);
      setRejectionReason('');
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to reject claim');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredClaims = claims.filter((c) => {
    if (statusFilter === 'all') return true;
    return c.status === statusFilter;
  });

  const pendingCount = claims.filter((c) => c.status === 'pending').length;
  const approvedCount = claims.filter((c) => c.status === 'approved').length;
  const rejectedCount = claims.filter((c) => c.status === 'rejected').length;
  const totalAmount = claims
    .filter((c) => c.status === 'approved')
    .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

  const portalNamespace = userRole === 'admin' ? 'admin' : userRole === 'hr' ? 'hr' : userRole === 'manager' ? 'manager' : 'employee';

  return (
    <PortalLayout namespace={portalNamespace}>
      <PageHeader
        title="Expense Claims & Reimbursements"
        description={
          canApprove
            ? "Review, approve, and manage official business expense claims and reimbursements."
            : "Submit official business claims for travel, internet, meal, and office supply reimbursements."
        }
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Expense Claim</span>
          </button>
        }
      />

      {/* SUMMARY STAT METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
            <span>Total Claims</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900">{claims.length}</p>
        </div>

        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-amber-700 font-bold uppercase tracking-wider mb-1">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-700">{pendingCount}</p>
        </div>

        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-emerald-700 font-bold uppercase tracking-wider mb-1">
            <span>Approved</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{approvedCount}</p>
        </div>

        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-indigo-700 font-bold uppercase tracking-wider mb-1">
            <span>Approved Total</span>
            <DollarSign className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-700">₹{totalAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all' ? 'bg-white text-[#0f365e] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Claims ({claims.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-2xs' : 'text-amber-700 hover:text-amber-900'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'approved' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-700 hover:text-emerald-900'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'rejected' ? 'bg-rose-600 text-white shadow-2xs' : 'text-rose-700 hover:text-rose-900'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>
      </div>

      {/* CLAIMS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium animate-pulse">Loading expense claims...</div>
        ) : filteredClaims.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">No expense claims match your selection.</div>
        ) : (
          <TablePrimitive
            headers={['Employee', 'Category', 'Claim Date', 'Amount (₹)', 'Description', 'Status', 'Actions']}
            rows={filteredClaims.map((c) => [
              <div key="emp" className="flex flex-col">
                <span className="font-extrabold text-slate-900 text-xs">{c.user?.name || 'Self'}</span>
                <span className="text-[10px] text-slate-400">{c.user?.department || c.user?.email || 'Staff'}</span>
              </div>,
              <span key="cat" className="capitalize text-xs text-slate-700 font-bold px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                {c.category}
              </span>,
              <span key="date" className="font-mono text-xs text-slate-500">{c.claim_date}</span>,
              <span key="amt" className="font-mono text-xs font-black text-slate-900">₹{c.amount}</span>,
              <span key="desc" className="text-xs text-slate-600 truncate max-w-xs">{c.description}</span>,
              <Badge
                key="status"
                variant={
                  c.status === 'approved'
                    ? 'green'
                    : c.status === 'rejected'
                    ? 'red'
                    : 'amber'
                }
              >
                {c.status.toUpperCase()}
              </Badge>,
              <div key="actions" className="flex items-center gap-1.5">
                {c.status === 'pending' ? (
                  canApprove ? (
                    <>
                      <button
                        onClick={() => handleApprove(c.id)}
                        disabled={actionLoadingId === c.id}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-lg shadow-2xs flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => {
                          setRejectingClaimId(c.id);
                          setRejectionReason('');
                        }}
                        disabled={actionLoadingId === c.id}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs rounded-lg shadow-2xs flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-slate-400 text-xs italic font-medium">Pending Review</span>
                  )
                ) : c.status === 'approved' ? (
                  <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Approved {c.approver?.name ? `by ${c.approver.name}` : ''}
                  </span>
                ) : (
                  <span
                    className="text-[11px] font-semibold text-rose-700 flex items-center gap-1 cursor-help"
                    title={c.rejection_reason || 'Declined'}
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    Rejected {c.approver?.name ? `by ${c.approver.name}` : ''}
                  </span>
                )}
              </div>,
            ])}
          />
        )}
      </div>

      {/* CREATE CLAIM MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Submit Expense Claim">
        <form onSubmit={handleCreateClaim} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Expense Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="Travel">Travel & Lodging</option>
                <option value="Food">Meals & Entertainment</option>
                <option value="Internet">Internet Allowance</option>
                <option value="Equipment">Hardware / Accessories</option>
                <option value="Office Supplies">Office Supplies</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Claim Amount (₹)</label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                placeholder="e.g. 1500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Expense Date</label>
            <input
              type="date"
              required
              value={claimDate}
              onChange={(e) => setClaimDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Business Description & Justification</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="State the purpose of expense..."
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
              Submit Claim
            </button>
          </div>
        </form>
      </Modal>

      {/* REJECTION REASON MODAL */}
      <Modal
        isOpen={rejectingClaimId !== null}
        onClose={() => setRejectingClaimId(null)}
        title="Decline Expense Claim"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            Please provide a brief reason or feedback for rejecting this expense claim:
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Rejection Reason</label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Missing valid tax invoice or amount exceeds approved allowance policy..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRejectingClaimId(null)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
            >
              Confirm Rejection
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
