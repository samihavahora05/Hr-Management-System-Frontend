'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { fetchApi } from '@/lib/api';
import { formatCurrency, downloadInvoiceAsPDF } from '@/lib/pdf-export';
import {
  Receipt,
  Download,
  Printer,
  Edit,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Building2,
  User,
  CreditCard,
  FileText,
  Trash2,
} from '@/components/ui/Icon';

export default function InvoiceDetailsPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [invoice, setInvoice] = useState<any | null>(null);
  const [company, setCompany] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [payReference, setPayReference] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payNotes, setPayNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    if (id) {
      loadInvoiceDetails();
    }
  }, [id]);

  const loadInvoiceDetails = async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/invoices/${id}`);
      if (res && res.invoice) {
        setInvoice(res.invoice);
        setCompany(res.company);
        setPayAmount(String(res.invoice.balance_due || 0));
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!invoice) return;
    downloadInvoiceAsPDF(invoice, company);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;
    setSubmittingPayment(true);
    try {
      await fetchApi(`/invoices/${invoice.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          paid_amount: parseFloat(payAmount),
          payment_method: payMethod,
          payment_reference: payReference,
          payment_date: payDate,
          notes: payNotes,
        }),
      });

      setToastMessage(`Payment of ${formatCurrency(payAmount, invoice.currency)} recorded successfully!`);
      setIsPaymentModalOpen(false);
      await loadInvoiceDetails();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loading) {
    return (
      <PortalLayout namespace="admin">
        <div className="p-12 text-center text-xs text-slate-500 font-medium">
          Loading invoice document...
        </div>
      </PortalLayout>
    );
  }

  if (!invoice) {
    return (
      <PortalLayout namespace="admin">
        <div className="p-12 text-center">
          <h2 className="text-base font-bold text-slate-800">Invoice not found</h2>
          <p className="text-xs text-slate-500 mt-1">The requested invoice could not be located in database.</p>
          <Link
            href="/admin/invoices"
            className="mt-4 inline-flex items-center gap-1 px-4 py-2 bg-[#0f365e] text-white text-xs font-bold rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Invoices</span>
          </Link>
        </div>
      </PortalLayout>
    );
  }

  const isOverdue = invoice.balance_due > 0 && invoice.due_date && new Date(invoice.due_date) < new Date();
  const items = invoice.items || [];

  return (
    <PortalLayout namespace="admin">
      <div className="no-print">
        <PageHeader
          title={`Invoice ${invoice.invoice_number}`}
          description={`Issued on ${new Date(invoice.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • Client: ${invoice.client_company_name || invoice.client_name}`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/admin/invoices"
                className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>All Invoices</span>
              </Link>

              {invoice.balance_due > 0 && (
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="py-2 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Record Payment</span>
                </button>
              )}

              <Link
                href={`/admin/invoices/${invoice.id}/edit`}
                className="py-2 px-3.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Invoice</span>
              </Link>

              <button
                type="button"
                onClick={handlePrint}
                className="py-2 px-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                className="py-2 px-4 bg-[#0f365e] hover:bg-[#164677] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>
          }
        />
      </div>

      {/* INVOICE PAPER CANVAS (PRINTABLE) */}
      <div
        id="printable-invoice-paper"
        className="max-w-4xl mx-auto bg-white border border-slate-200 shadow-sm pt-12 pb-14 px-8 sm:px-14 space-y-8 font-sans print:border-none print:shadow-none print:p-0 print:pt-10 text-slate-800 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]"
      >
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4">
          <div>
            <img
              src={company?.logo || user?.organization_logo || '/images/logoblue.png'}
              alt="BLUEBOXX DA"
              className="h-16 max-w-[260px] object-contain mb-2"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/Boxxlogo.png';
              }}
            />
          </div>

          <div className="text-right">
            <div className="bg-[#269784] text-white font-extrabold text-base tracking-wider px-5 py-2 uppercase inline-block">
              PERFORMA INVOICE
            </div>
            <div className="text-xs text-slate-500 mt-2 font-medium">
              Bill date: {invoice.invoice_date ? new Date(invoice.invoice_date).toISOString().slice(0, 10) : ''}
            </div>
          </div>
        </div>

        {/* HORIZONTAL DIVIDER LINE */}
        <hr className="border-t border-slate-200 my-4" />

        {/* TWO-COLUMN FROM / BILL TO SECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs leading-relaxed text-slate-700">
          {/* Company Info */}
          <div>
            <div className="font-bold text-slate-900 text-sm mb-1">
              {company?.name || 'Blueboxx DA'}
            </div>
            <p className="text-slate-600">
              {company?.address || '02, India Bulls Mall, Jetalpur Road, Vadodara'}
            </p>
            <p className="text-slate-600">
              Phone: {company?.phone || '9023512853'}
            </p>
            <p className="text-slate-600">
              Website: <span className="text-slate-700">{company?.website || 'http://www.blueboxx.in/'}</span>
            </p>
            {company?.gst_number && (
              <p className="text-slate-600 font-mono">
                GSTIN: {company.gst_number}
              </p>
            )}
          </div>

          {/* Bill To */}
          <div>
            <div className="font-bold text-slate-900 text-sm mb-1">Bill To</div>
            <div className="font-semibold text-slate-900 text-sm">
              {invoice.client_name || invoice.client_company_name}
            </div>
            {invoice.client_company_name && invoice.client_name && (
              <div className="text-slate-700 font-medium">{invoice.client_company_name}</div>
            )}
            <div className="text-slate-600 whitespace-pre-line mt-1">
              {invoice.client_address && <p>{invoice.client_address}</p>}
              <p>
                {invoice.client_city}
                {invoice.client_state ? `, ${invoice.client_state}` : ''}
              </p>
              {invoice.client_postal_code && <p>{invoice.client_postal_code}</p>}
              {invoice.client_country && <p>{invoice.client_country}</p>}
              {invoice.client_phone && <p>Phone: {invoice.client_phone}</p>}
              {invoice.client_email && <p>Email: {invoice.client_email}</p>}
              {invoice.client_tax_number && <p className="font-mono">GSTIN: {invoice.client_tax_number}</p>}
            </div>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#269784] text-white font-bold text-xs">
                <th className="py-2.5 px-4 font-semibold">Item</th>
                <th className="py-2.5 px-4 text-center font-semibold w-24">Quantity</th>
                <th className="py-2.5 px-4 text-right font-semibold w-32">Rate</th>
                <th className="py-2.5 px-4 text-right font-semibold w-36">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it: any, index: number) => (
                <tr key={it.id || index} className={index % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{it.item_name}</div>
                    {it.description && (
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-normal">{it.description}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-800">{it.quantity}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-800">
                    {formatCurrency(it.rate, invoice.currency)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                    {formatCurrency(it.total, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FINANCIAL TOTALS RIGHT ALIGNED */}
        <div className="flex justify-end pt-2">
          <div className="w-80 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100 text-slate-700">
              <span className="font-medium text-right w-1/2 pr-4">Sub Total</span>
              <span className="font-mono text-right w-1/2">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>

            {invoice.discount_amount > 0 && (
              <div className="flex justify-between py-2 border-b border-slate-100 text-slate-700">
                <span className="font-medium text-right w-1/2 pr-4">
                  Discount {invoice.discount_type === 'percentage' ? `(${invoice.discount_value}%)` : ''}
                </span>
                <span className="font-mono text-right w-1/2 text-emerald-700">
                  -{formatCurrency(invoice.discount_amount, invoice.currency)}
                </span>
              </div>
            )}

            {invoice.tax_amount > 0 && (
              <div className="flex justify-between py-2 border-b border-slate-100 text-slate-700">
                <span className="font-medium text-right w-1/2 pr-4">Tax ({invoice.tax_percentage}%)</span>
                <span className="font-mono text-right w-1/2">+{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
              </div>
            )}

            <div className="flex justify-between py-2 border-b border-slate-100 text-slate-700">
              <span className="font-medium text-right w-1/2 pr-4">Paid</span>
              <span className="font-mono text-right w-1/2">{formatCurrency(invoice.paid_amount, invoice.currency)}</span>
            </div>

            <div className="flex justify-between items-center py-2 bg-[#269784] text-white px-3 font-bold mt-1">
              <span className="text-right w-1/2 pr-2">Balance Due</span>
              <span className="font-mono text-right w-1/2 text-sm">
                {formatCurrency(invoice.balance_due, invoice.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* BANK & NOTES SECTION (IF APPLICABLE) */}
        {(company?.bank_details || invoice.notes || invoice.terms) && (
          <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-500">
            {company?.bank_details && (
              <div>
                <span className="font-bold text-slate-700 block mb-1">Bank Details:</span>
                <p>Bank: {company.bank_details.bank_name}</p>
                <p>A/C Name: {company.bank_details.account_name}</p>
                <p className="font-mono">A/C No: {company.bank_details.account_number}</p>
                <p className="font-mono">IFSC: {company.bank_details.ifsc_code}</p>
              </div>
            )}
            <div>
              {invoice.notes && (
                <div className="mb-2">
                  <span className="font-bold text-slate-700 block mb-0.5">Notes:</span>
                  <p className="text-slate-600">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <span className="font-bold text-slate-700 block mb-0.5">Terms:</span>
                  <p className="text-slate-600">{invoice.terms}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* RECORD PAYMENT MODAL */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Record Payment for ${invoice.invoice_number}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-500 font-bold block">Client / Company</span>
              <span className="font-extrabold text-slate-800 text-sm">
                {invoice.client_company_name || invoice.client_name}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 font-bold block">Balance Due</span>
              <span className="font-black text-rose-700 text-base font-mono">
                {formatCurrency(invoice.balance_due, invoice.currency)}
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
                max={invoice.balance_due || 9999999}
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
              placeholder="e.g. Settled via RTGS transaction"
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

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </PortalLayout>
  );
}
