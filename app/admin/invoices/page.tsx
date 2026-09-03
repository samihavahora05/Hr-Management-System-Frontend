'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { fetchApi } from '@/lib/api';
import { exportToCSV } from '@/lib/export';
import { formatCurrency, downloadInvoiceAsPDF } from '@/lib/pdf-export';
import {
  Receipt,
  Plus,
  Search,
  Download,
  Printer,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Building2,
  User,
  CreditCard,
  FileText,
} from '@/components/ui/Icon';

export default function AdminInvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    total_invoices: 0,
    total_amount: 0,
    paid_amount: 0,
    outstanding_amount: 0,
    overdue_amount: 0,
    paid_count: 0,
    partially_paid_count: 0,
    unpaid_count: 0,
    overdue_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Quick Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [payReference, setPayReference] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payNotes, setPayNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Delete Confirm Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, [paymentStatusFilter, statusFilter, startDate, endDate]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (paymentStatusFilter && paymentStatusFilter !== 'all') params.append('payment_status', paymentStatusFilter);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const res = await fetchApi(`/invoices?${params.toString()}`);
      if (res && res.invoices) {
        setInvoices(res.invoices);
        if (res.summary) {
          setSummary(res.summary);
        }
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadInvoices();
  };

  const openPaymentModal = (inv: any) => {
    setSelectedInvoice(inv);
    setPayAmount(String(inv.balance_due || 0));
    setPayMethod('Bank Transfer');
    setPayReference('');
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setSubmittingPayment(true);
    try {
      await fetchApi(`/invoices/${selectedInvoice.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          paid_amount: parseFloat(payAmount),
          payment_method: payMethod,
          payment_reference: payReference,
          payment_date: payDate,
          notes: payNotes,
        }),
      });

      setToastMessage(`Payment of ${formatCurrency(payAmount)} recorded for ${selectedInvoice.invoice_number}!`);
      setIsPaymentModalOpen(false);
      setSelectedInvoice(null);
      await loadInvoices();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const openDeleteModal = (inv: any) => {
    setInvoiceToDelete(inv);
    setDeleteModalOpen(true);
  };

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    setDeleting(true);
    try {
      await fetchApi(`/invoices/${invoiceToDelete.id}`, {
        method: 'DELETE',
      });
      setToastMessage(`Invoice ${invoiceToDelete.invoice_number} deleted successfully.`);
      setDeleteModalOpen(false);
      setInvoiceToDelete(null);
      await loadInvoices();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to delete invoice');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Invoice Number',
      'Client Name',
      'Company Name',
      'Email',
      'Invoice Date',
      'Due Date',
      'Total Amount',
      'Paid Amount',
      'Balance Due',
      'Payment Status',
      'Invoice Status',
    ];

    const data = invoices.map((inv) => [
      inv.invoice_number,
      inv.client_name,
      inv.client_company_name || 'N/A',
      inv.client_email || 'N/A',
      inv.invoice_date,
      inv.due_date || 'N/A',
      inv.total_amount,
      inv.paid_amount,
      inv.balance_due,
      inv.payment_status,
      inv.status,
    ]);

    exportToCSV('blueboxx_invoices_directory', headers, data);
    setToastMessage('Invoices directory exported to CSV successfully!');
  };

  const handleQuickDownloadPDF = async (inv: any) => {
    try {
      const res = await fetchApi(`/invoices/${inv.id}`);
      if (res.invoice) {
        downloadInvoiceAsPDF(res.invoice, res.company);
      }
    } catch (e: any) {
      setToastMessage('Error generating invoice PDF: ' + e.message);
    }
  };

  return (
    <PortalLayout namespace="admin">
      <PageHeader
        title="Invoice Management"
        description="Create, monitor, collect client payments, and manage enterprise client billing records"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="py-2 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <Link
              href="/admin/invoices/create"
              className="py-2 px-4 bg-[#0f365e] hover:bg-[#164677] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </Link>
          </div>
        }
      />

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Invoices */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Invoices</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0f365e] flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {summary.total_invoices || 0}
          </div>
          <div className="text-[11px] font-semibold text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-600 font-bold">{summary.paid_count || 0} Paid</span> •{' '}
            <span className="text-amber-600 font-bold">{summary.partially_paid_count || 0} Partial</span> •{' '}
            <span className="text-rose-600 font-bold">{summary.unpaid_count || 0} Unpaid</span>
          </div>
        </div>

        {/* Total Invoiced Amount */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue Invoiced</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-900 mt-2">
            {formatCurrency(summary.total_amount)}
          </div>
          <div className="text-[11px] font-semibold text-indigo-600/80 mt-1">
            Across all active enterprise contracts
          </div>
        </div>

        {/* Paid Amount */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paid / Collected</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {formatCurrency(summary.paid_amount)}
          </div>
          <div className="text-[11px] font-semibold text-emerald-600/90 mt-1">
            Successfully cleared payments
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding Balance</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 mt-2">
            {formatCurrency(summary.outstanding_amount)}
          </div>
          <div className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
            {summary.overdue_amount > 0 && (
              <span>⚠️ {formatCurrency(summary.overdue_amount)} overdue</span>
            )}
            {summary.overdue_amount === 0 && (
              <span className="text-slate-400">All within payment terms</span>
            )}
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice #, client, email, PO..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f365e]/20"
            />
          </div>

          {/* Payment Status Filter */}
          <div className="md:col-span-2">
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium text-slate-700"
            >
              <option value="all">Payment: All Statuses</option>
              <option value="paid">✓ Paid</option>
              <option value="partially_paid">◐ Partially Paid</option>
              <option value="unpaid">○ Unpaid</option>
              <option value="overdue">⚠️ Overdue</option>
            </select>
          </div>

          {/* Invoice Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium text-slate-700"
            >
              <option value="all">Invoice: All (Sent/Draft)</option>
              <option value="sent">Sent</option>
              <option value="draft">Draft</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date Range Start */}
          <div className="md:col-span-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-700"
              title="From Date"
            />
          </div>

          {/* Date Range End & Action */}
          <div className="md:col-span-2 flex items-center gap-2">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-700"
              title="To Date"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-[#0f365e] hover:bg-[#164677] text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* INVOICES TABLE PRIMITIVE */}
      <div className="bg-white border border-[#c3c6cf] rounded-2xl p-5 shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-medium">
            Loading invoices & client billing records...
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No invoices found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Get started by creating your first client invoice with custom line items, tax, and automated PDF delivery.
            </p>
            <Link
              href="/admin/invoices/create"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0f365e] hover:bg-[#164677] text-white font-bold text-xs rounded-xl shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Invoice</span>
            </Link>
          </div>
        ) : (
          <TablePrimitive
            headers={[
              'Invoice #',
              'Client / Organization',
              'Invoice Date',
              'Due Date',
              'Total Amount',
              'Paid Amount',
              'Balance Due',
              'Payment Status',
              'Actions',
            ]}
            rows={invoices.map((inv) => {
              const isOverdue = inv.balance_due > 0 && inv.due_date && new Date(inv.due_date) < new Date();
              const paymentVariant =
                inv.payment_status === 'paid'
                  ? 'green'
                  : inv.payment_status === 'partially_paid'
                  ? 'yellow'
                  : isOverdue
                  ? 'red'
                  : 'gray';

              return [
                <div key={inv.id + '-num'}>
                  <Link
                    href={`/admin/invoices/${inv.id}`}
                    className="font-extrabold text-[#0f365e] hover:underline font-mono text-xs flex items-center gap-1"
                  >
                    <span>{inv.invoice_number}</span>
                  </Link>
                  {inv.reference_number && (
                    <div className="text-[10px] text-slate-400 font-mono">Ref: {inv.reference_number}</div>
                  )}
                </div>,

                <div key={inv.id + '-client'}>
                  <div className="font-bold text-slate-900 text-xs">
                    {inv.client_company_name || inv.client_name}
                  </div>
                  {inv.client_company_name && (
                    <div className="text-[10px] text-slate-500">Attn: {inv.client_name}</div>
                  )}
                  {inv.client_email && (
                    <div className="text-[10px] text-slate-400 font-mono">{inv.client_email}</div>
                  )}
                </div>,

                <span key="inv-date" className="text-xs text-slate-700 font-medium">
                  {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                </span>,

                <span key="due-date" className={`text-xs font-semibold ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                  {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Due on receipt'}
                  {isOverdue && <span className="block text-[9px] text-rose-500 uppercase font-bold">Overdue</span>}
                </span>,

                <span key="tot-amt" className="text-xs font-bold text-slate-900 font-mono">
                  {formatCurrency(inv.total_amount, inv.currency)}
                </span>,

                <span key="paid-amt" className="text-xs font-bold text-emerald-700 font-mono">
                  {formatCurrency(inv.paid_amount, inv.currency)}
                </span>,

                <span key="bal-amt" className={`text-xs font-bold font-mono ${inv.balance_due > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                  {formatCurrency(inv.balance_due, inv.currency)}
                </span>,

                <Badge key="pay-status" variant={paymentVariant as any}>
                  {inv.payment_status === 'paid'
                    ? 'Paid'
                    : inv.payment_status === 'partially_paid'
                    ? 'Partial'
                    : isOverdue
                    ? 'Overdue'
                    : 'Unpaid'}
                </Badge>,

                <div key={inv.id + '-actions'} className="flex items-center gap-1.5">
                  <Link
                    href={`/admin/invoices/${inv.id}`}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                    title="View invoice preview & full details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => handleQuickDownloadPDF(inv)}
                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-[#0f365e] rounded-lg text-xs font-bold transition-all cursor-pointer"
                    title="Download / Print PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {inv.balance_due > 0 && (
                    <button
                      onClick={() => openPaymentModal(inv)}
                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                      title="Record payment"
                    >
                      <CreditCard className="w-3 h-3 text-emerald-600" />
                      <span>Pay</span>
                    </button>
                  )}

                  <Link
                    href={`/admin/invoices/${inv.id}/edit`}
                    className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-bold transition-all"
                    title="Edit invoice"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => openDeleteModal(inv)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    title="Delete invoice"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>,
              ];
            })}
          />
        )}
      </div>

      {/* QUICK PAYMENT MODAL */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedInvoice(null);
        }}
        title={`Record Payment for ${selectedInvoice?.invoice_number || ''}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-500 font-bold block">Client / Company</span>
              <span className="font-extrabold text-slate-800 text-sm">
                {selectedInvoice?.client_company_name || selectedInvoice?.client_name}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 font-bold block">Balance Due</span>
              <span className="font-black text-rose-700 text-base font-mono">
                {formatCurrency(selectedInvoice?.balance_due, selectedInvoice?.currency)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                max={selectedInvoice?.balance_due || 9999999}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
              >
                <option value="Bank Transfer">NEFT / RTGS / Bank Transfer</option>
                <option value="UPI / QR">UPI / QR Code</option>
                <option value="Credit Card">Corporate Credit Card</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
                <option value="Wire Transfer">International Wire (SWIFT)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Ref / Cheque #</label>
              <input
                type="text"
                value={payReference}
                onChange={(e) => setPayReference(e.target.value)}
                placeholder="e.g. TXN8829102"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                required
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Payment Note (Optional)</label>
            <textarea
              rows={2}
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              placeholder="e.g. Received via HDFC Bank NEFT settlement"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingPayment}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
            >
              {submittingPayment ? 'Recording...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setInvoiceToDelete(null);
        }}
        title="Confirm Invoice Deletion"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you want to permanently delete invoice{' '}
            <strong className="text-slate-900 font-mono">{invoiceToDelete?.invoice_number}</strong> for{' '}
            <strong>{invoiceToDelete?.client_company_name || invoiceToDelete?.client_name}</strong>?
          </p>
          <p className="text-[11px] text-rose-600 font-semibold">
            This action cannot be undone and will remove all associated line item records.
          </p>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteInvoice}
              disabled={deleting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Invoice'}
            </button>
          </div>
        </div>
      </Modal>

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </PortalLayout>
  );
}
