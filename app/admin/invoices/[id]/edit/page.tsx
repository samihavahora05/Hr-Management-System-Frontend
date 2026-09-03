'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { fetchApi } from '@/lib/api';
import { formatCurrency } from '@/lib/pdf-export';
import {
  Receipt,
  Plus,
  Trash2,
  ArrowLeft,
  Eye,
  CheckCircle2,
  Building2,
  User,
  CreditCard,
  FileText,
} from '@/components/ui/Icon';

interface InvoiceItemForm {
  id?: number | string;
  item_name: string;
  description: string;
  quantity: number;
  rate: number;
  discount: number;
  tax_percentage: number;
}

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  // Invoice Meta
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [status, setStatus] = useState('sent');

  // Client Selection & Auto-fetch
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientCompanyName, setClientCompanyName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientTaxNumber, setClientTaxNumber] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientState, setClientState] = useState('');
  const [clientPostalCode, setClientPostalCode] = useState('');
  const [clientCountry, setClientCountry] = useState('India');

  // Dynamic Line Items
  const [items, setItems] = useState<InvoiceItemForm[]>([]);

  // Discounts & Global Taxes
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxPercentage, setTaxPercentage] = useState<number>(18);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // Notes & Terms
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');

  // UI States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
    if (id) {
      loadInvoice();
    }
  }, [id]);

  const loadClients = async () => {
    try {
      const res = await fetchApi('/clients');
      if (res && res.clients) {
        setClientsList(res.clients);
      }
    } catch (e) {
      // ignore
    }
  };

  const loadInvoice = async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/invoices/${id}`);
      if (res && res.invoice) {
        const inv = res.invoice;
        setInvoiceNumber(inv.invoice_number || '');
        setReferenceNumber(inv.reference_number || '');
        setInvoiceDate(inv.invoice_date ? String(inv.invoice_date).slice(0, 10) : '');
        setDueDate(inv.due_date ? String(inv.due_date).slice(0, 10) : '');
        setCurrency(inv.currency || 'INR');
        setStatus(inv.status || 'sent');

        setSelectedClientId(inv.client_id ? String(inv.client_id) : 'custom');
        setClientName(inv.client_name || '');
        setClientCompanyName(inv.client_company_name || '');
        setClientEmail(inv.client_email || '');
        setClientPhone(inv.client_phone || '');
        setClientTaxNumber(inv.client_tax_number || '');
        setClientAddress(inv.client_address || '');
        setClientCity(inv.client_city || '');
        setClientState(inv.client_state || '');
        setClientPostalCode(inv.client_postal_code || '');
        setClientCountry(inv.client_country || 'India');

        setDiscountType((inv.discount_type as any) || 'fixed');
        setDiscountValue(parseFloat(inv.discount_value) || 0);
        setTaxPercentage(parseFloat(inv.tax_percentage) || 18);
        setPaidAmount(parseFloat(inv.paid_amount) || 0);
        setNotes(inv.notes || '');
        setTerms(inv.terms || '');

        if (inv.items && inv.items.length > 0) {
          setItems(
            inv.items.map((it: any) => ({
              id: it.id,
              item_name: it.item_name || '',
              description: it.description || '',
              quantity: parseFloat(it.quantity) || 1,
              rate: parseFloat(it.rate) || 0,
              discount: parseFloat(it.discount) || 0,
              tax_percentage: parseFloat(it.tax_percentage) || 0,
            }))
          );
        } else {
          setItems([
            {
              item_name: 'Consulting & Engineering Services',
              description: '',
              quantity: 1,
              rate: 50000,
              discount: 0,
              tax_percentage: 18,
            },
          ]);
        }
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleClientDropdownChange = (cId: string) => {
    setSelectedClientId(cId);
    if (cId === 'custom') return;
    const found = clientsList.find((c) => String(c.id) === String(cId));
    if (found) {
      setClientName(found.name || '');
      setClientCompanyName(found.company_name || '');
      setClientEmail(found.email || '');
      setClientPhone(found.phone || '');
      setClientTaxNumber(found.tax_number || '');
      setClientAddress(found.address || '');
      setClientCity(found.city || '');
      setClientState(found.state || '');
      setClientPostalCode(found.postal_code || '');
      setClientCountry(found.country || 'India');
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: 'item-' + Date.now(),
        item_name: '',
        description: '',
        quantity: 1,
        rate: 0,
        discount: 0,
        tax_percentage: 18,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setToastMessage('Invoice must have at least one line item.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItemForm, value: any) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setItems(updated);
  };

  // Calculations
  const calculateSubtotal = () => {
    return items.reduce((acc, it) => {
      const lineTotal = Math.max(0, (Number(it.quantity) || 0) * (Number(it.rate) || 0) - (Number(it.discount) || 0));
      return acc + lineTotal;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const calculatedDiscount =
    discountType === 'percentage'
      ? subtotal * ((Number(discountValue) || 0) / 100)
      : Number(discountValue) || 0;
  const safeDiscount = Math.min(subtotal, Math.max(0, calculatedDiscount));

  const taxableAmount = Math.max(0, subtotal - safeDiscount);
  const taxAmount = taxableAmount * ((Number(taxPercentage) || 0) / 100);
  const grandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;
  const balanceDue = Math.max(0, Math.round((grandTotal - (Number(paidAmount) || 0)) * 100) / 100);

  const calculatedPaymentStatus =
    paidAmount >= grandTotal && grandTotal > 0
      ? 'paid'
      : paidAmount > 0
      ? 'partially_paid'
      : 'unpaid';

  const handleUpdateInvoice = async () => {
    if (!clientName) {
      setToastMessage('Please enter client contact name.');
      return;
    }
    if (items.some((it) => !it.item_name.trim())) {
      setToastMessage('All line items must have a title.');
      return;
    }

    setSubmitting(true);
    try {
      await fetchApi(`/invoices/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          invoice_number: invoiceNumber,
          reference_number: referenceNumber || undefined,
          client_id: selectedClientId && selectedClientId !== 'custom' ? Number(selectedClientId) : null,
          client_name: clientName,
          client_company_name: clientCompanyName || undefined,
          client_email: clientEmail || undefined,
          client_phone: clientPhone || undefined,
          client_tax_number: clientTaxNumber || undefined,
          client_address: clientAddress || undefined,
          client_city: clientCity || undefined,
          client_state: clientState || undefined,
          client_postal_code: clientPostalCode || undefined,
          client_country: clientCountry || 'India',
          invoice_date: invoiceDate,
          due_date: dueDate || undefined,
          currency,
          discount_type: discountType,
          discount_value: Number(discountValue) || 0,
          tax_percentage: Number(taxPercentage) || 0,
          paid_amount: Number(paidAmount) || 0,
          status,
          notes,
          terms,
          items: items.map((it) => ({
            item_name: it.item_name,
            description: it.description,
            quantity: Number(it.quantity) || 1,
            rate: Number(it.rate) || 0,
            discount: Number(it.discount) || 0,
            tax_percentage: Number(it.tax_percentage) || 0,
          })),
        }),
      });

      setToastMessage(`Invoice ${invoiceNumber} updated successfully!`);
      router.push(`/admin/invoices/${id}`);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to update invoice');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PortalLayout namespace="admin">
        <div className="p-12 text-center text-xs text-slate-500 font-medium">
          Loading invoice details for editing...
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout namespace="admin">
      <PageHeader
        title={`Edit Invoice ${invoiceNumber}`}
        description="Update line items, tax, client billing address, and payment terms"
        action={
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/invoices/${id}`}
              className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Cancel & View</span>
            </Link>
            <button
              type="button"
              disabled={submitting}
              onClick={handleUpdateInvoice}
              className="py-2 px-4 bg-[#0f365e] hover:bg-[#164677] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Saving Changes...' : 'Save & Update Invoice'}</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* MAIN FORM COLUMN (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          {/* SECTION 1: INVOICE INFORMATION */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0f365e] flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Invoice Identification</h3>
                  <p className="text-[11px] text-slate-500">Invoice number, dates, and PO reference</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Number *</label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-[#0f365e] bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Date *</label>
                <input
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">P.O. / Reference Number</label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Billing Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-bold"
                >
                  <option value="INR">INR (₹ - Indian Rupee)</option>
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-bold text-slate-800"
                >
                  <option value="sent">Sent</option>
                  <option value="draft">Draft</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: CLIENT INFORMATION */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Client / Customer Billing Details</h3>
                  <p className="text-[11px] text-slate-500">Edit billing contact or select from directory</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Client from Directory</label>
              <select
                value={selectedClientId}
                onChange={(e) => handleClientDropdownChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-bold text-[#0f365e]"
              >
                <option value="custom">✏️ Custom / Manually Specified Client</option>
                {clientsList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name ? `${c.company_name} (${c.name})` : c.name} — {c.city || 'India'}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Client Contact Name *</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization Name</label>
                <input
                  type="text"
                  value={clientCompanyName}
                  onChange={(e) => setClientCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Client Email Address</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN / Tax ID Number</label>
                <input
                  type="text"
                  value={clientTaxNumber}
                  onChange={(e) => setClientTaxNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Billing Street Address</label>
              <input
                type="text"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={clientCity}
                  onChange={(e) => setClientCity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={clientState}
                  onChange={(e) => setClientState(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Postal / ZIP Code</label>
                <input
                  type="text"
                  value={clientPostalCode}
                  onChange={(e) => setClientPostalCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  value={clientCountry}
                  onChange={(e) => setClientCountry(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: INVOICE LINE ITEMS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Line Items & Deliverables</h3>
                  <p className="text-[11px] text-slate-500">Edit quantities, rates, and item descriptions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1 cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((it, idx) => {
                const lineTotal = Math.max(0, (Number(it.quantity) || 0) * (Number(it.rate) || 0) - (Number(it.discount) || 0));
                return (
                  <div
                    key={it.id || idx}
                    className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 font-mono">
                        Item #{idx + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-7">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Item / Service Title *</label>
                        <input
                          type="text"
                          required
                          value={it.item_name}
                          onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-bold text-slate-900"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Qty</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-mono text-center font-bold"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Unit Rate (₹) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={it.rate}
                          onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-mono font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Detailed Description (Optional)</label>
                      <textarea
                        rows={2}
                        value={it.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500 font-bold">Item Disc:</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={it.discount}
                            onChange={(e) => handleItemChange(idx, 'discount', e.target.value)}
                            className="w-20 px-2 py-1 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 text-[11px] font-bold">Item Total:</span>
                        <span className="text-slate-900 font-extrabold font-mono text-sm">
                          {formatCurrency(lineTotal, currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-[#0f365e] hover:bg-slate-50 text-slate-600 hover:text-[#0f365e] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Another Line Item</span>
            </button>
          </div>

          {/* SECTION 4: NOTES & TERMS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Notes & Terms & Conditions</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Notes / Bank Instructions</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Terms & Conditions</label>
                <textarea
                  rows={3}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* FINANCIAL SUMMARY & ACTIONS SIDEBAR (4 COLS) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs sticky top-20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Financial Summary</h3>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${
                calculatedPaymentStatus === 'paid'
                  ? 'bg-emerald-100 text-emerald-800'
                  : calculatedPaymentStatus === 'partially_paid'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {calculatedPaymentStatus.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Subtotal:</span>
                <span className="font-bold font-mono text-slate-900">{formatCurrency(subtotal, currency)}</span>
              </div>

              {/* Discount settings */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-600 font-bold">Discount:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDiscountType('fixed')}
                      className={`text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer ${
                        discountType === 'fixed' ? 'bg-[#0f365e] text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Flat (₹)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('percentage')}
                      className={`text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer ${
                        discountType === 'percentage' ? 'bg-[#0f365e] text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      %
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                  {safeDiscount > 0 && (
                    <span className="text-emerald-700 font-bold font-mono text-xs shrink-0">
                      -{formatCurrency(safeDiscount, currency)}
                    </span>
                  )}
                </div>
              </div>

              {/* Tax Settings */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-600 font-bold">GST / Tax Percentage (%):</span>
                  <div className="flex items-center gap-1">
                    {[0, 5, 12, 18, 28].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTaxPercentage(t)}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                          taxPercentage === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t}%
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Tax Amount:</span>
                  <span className="font-bold font-mono text-slate-900">+{formatCurrency(taxAmount, currency)}</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="pt-3 pb-3 border-t-2 border-b-2 border-slate-200 flex justify-between items-center text-sm font-extrabold text-[#0f365e]">
                <span>Grand Total:</span>
                <span className="text-base font-black font-mono">{formatCurrency(grandTotal, currency)}</span>
              </div>

              {/* Paid Amount Input */}
              <div className="pt-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Paid / Advance Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={grandTotal}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-emerald-700"
                />
              </div>

              {/* Balance Due */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                <span className="font-bold text-slate-700">Balance Due:</span>
                <span className="font-black text-rose-700 text-base font-mono">
                  {formatCurrency(balanceDue, currency)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <button
                type="button"
                disabled={submitting}
                onClick={handleUpdateInvoice}
                className="w-full py-2.5 bg-[#0f365e] hover:bg-[#164677] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Saving Changes...' : 'Save & Update Invoice'}</span>
              </button>

              <Link
                href={`/admin/invoices/${id}`}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Cancel</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </PortalLayout>
  );
}
