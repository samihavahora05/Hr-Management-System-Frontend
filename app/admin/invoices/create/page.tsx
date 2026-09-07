'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
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
  Clock,
  Sparkles,
} from '@/components/ui/Icon';

interface InvoiceItemForm {
  id: string;
  item_name: string;
  description: string;
  quantity: number;
  rate: number;
  discount: number;
  tax_percentage: number;
}

export default function CreateInvoicePage() {
  const { user } = useAuth();
  const router = useRouter();

  // Invoice Meta
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  });
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
  const [items, setItems] = useState<InvoiceItemForm[]>([
    {
      id: 'item-1',
      item_name: 'Enterprise Cloud Application Development',
      description: 'Custom React & Laravel RESTful module implementation with secure RBAC.',
      quantity: 1,
      rate: 75000,
      discount: 0,
      tax_percentage: 18,
    },
  ]);

  // Discounts & Global Taxes
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxPercentage, setTaxPercentage] = useState<number>(18);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // Payment Details
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Notes & Terms
  const [notes, setNotes] = useState('Thank you for choosing BLUEBOXX Enterprise. Please make all electronic remittances payable to our company account.');
  const [terms, setTerms] = useState('Payment terms: Net 15 days. Unpaid balances past due date incur 1.5% monthly interest. Vadodara jurisdiction.');

  // UI States
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Add Client Quick Modal
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [newCName, setNewCName] = useState('');
  const [newCCompany, setNewCCompany] = useState('');
  const [newCEmail, setNewCEmail] = useState('');
  const [newCPhone, setNewCPhone] = useState('');
  const [newCTax, setNewCTax] = useState('');
  const [newCAddress, setNewCAddress] = useState('');
  const [newCCity, setNewCCity] = useState('Vadodara');
  const [newCState, setNewCState] = useState('Gujarat');
  const [newCPostal, setNewCPostal] = useState('390022');
  const [creatingClient, setCreatingClient] = useState(false);

  useEffect(() => {
    loadClients();
    loadNextInvoiceNumber();
  }, []);

  const loadClients = async () => {
    try {
      const res = await fetchApi('/clients');
      if (res && res.clients) {
        setClientsList(res.clients);
        if (res.clients.length > 0 && !selectedClientId) {
          applyClientSelection(res.clients[0]);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const loadNextInvoiceNumber = async () => {
    try {
      const res = await fetchApi('/invoices/next-number');
      if (res && res.next_invoice_number) {
        setInvoiceNumber(res.next_invoice_number);
      }
    } catch (e) {
      setInvoiceNumber('INV-000178');
    }
  };

  const applyClientSelection = (c: any) => {
    if (!c) return;
    setSelectedClientId(String(c.id));
    setClientName(c.name || '');
    setClientCompanyName(c.company_name || '');
    setClientEmail(c.email || '');
    setClientPhone(c.phone || '');
    setClientTaxNumber(c.tax_number || '');
    setClientAddress(c.address || '');
    setClientCity(c.city || '');
    setClientState(c.state || '');
    setClientPostalCode(c.postal_code || '');
    setClientCountry(c.country || 'India');
  };

  const handleClientDropdownChange = (cId: string) => {
    setSelectedClientId(cId);
    if (cId === 'custom') {
      return;
    }
    const found = clientsList.find((c) => String(c.id) === String(cId));
    if (found) {
      applyClientSelection(found);
    }
  };

  const handleCreateQuickClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingClient(true);
    try {
      const res = await fetchApi('/clients', {
        method: 'POST',
        body: JSON.stringify({
          name: newCName,
          company_name: newCCompany,
          email: newCEmail,
          phone: newCPhone,
          tax_number: newCTax,
          address: newCAddress,
          city: newCCity,
          state: newCState,
          postal_code: newCPostal,
          country: 'India',
        }),
      });

      setToastMessage('New client added to organization directory!');
      setIsAddClientModalOpen(false);
      await loadClients();
      if (res.client) {
        applyClientSelection(res.client);
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to create client');
    } finally {
      setCreatingClient(false);
    }
  };

  // Line Item actions
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

  const handleSaveInvoice = async (asDraft = false) => {
    if (!clientName) {
      setToastMessage('Please enter or select a client name.');
      return;
    }
    if (items.some((it) => !it.item_name.trim())) {
      setToastMessage('All line items must have a service or item name.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchApi('/invoices', {
        method: 'POST',
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
          status: asDraft ? 'draft' : status,
          payment_method: paidAmount > 0 ? paymentMethod : undefined,
          payment_reference: paidAmount > 0 ? paymentReference : undefined,
          payment_date: paidAmount > 0 ? paymentDate : undefined,
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

      setToastMessage(`Invoice ${invoiceNumber} created successfully!`);
      if (res.invoice?.id) {
        router.push(`/admin/invoices/${res.invoice.id}`);
      } else {
        router.push('/admin/invoices');
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to create invoice');
      setSubmitting(false);
    }
  };

  return (
    <PortalLayout namespace="admin">
      <PageHeader
        title="Create New Invoice"
        description="Generate a modern, itemized billing invoice for clients with live calculations and PDF support"
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/invoices"
              className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Invoices</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(true)}
              className="py-2 px-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Live Preview</span>
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSaveInvoice(false)}
              className="py-2 px-4 bg-[#0f365e] hover:bg-[#164677] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Creating Invoice...' : 'Save & Issue Invoice'}</span>
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
                  <h3 className="text-sm font-bold text-slate-900">Invoice Information</h3>
                  <p className="text-[11px] text-slate-500">Invoice sequencing, dates, and PO numbers</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg">
                {currency} (₹)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Number *</label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="INV-000178"
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
                  placeholder="e.g. PO-2026-9810"
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
                  <option value="sent">Sent (Active Bill)</option>
                  <option value="draft">Draft</option>
                  <option value="paid">Paid</option>
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
                  <p className="text-[11px] text-slate-500">Auto-filled from database or enter invoice-specific address</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddClientModalOpen(true)}
                className="text-xs font-extrabold text-[#0f365e] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Client</span>
              </button>
            </div>

            {/* Client Selector Dropdown */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Existing Client from Directory</label>
              <select
                value={selectedClientId}
                onChange={(e) => handleClientDropdownChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-bold text-[#0f365e]"
              >
                <option value="custom">✏️ Enter Custom Client Details</option>
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
                  placeholder="e.g. Rahul Singhania"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization Name</label>
                <input
                  type="text"
                  value={clientCompanyName}
                  onChange={(e) => setClientCompanyName(e.target.value)}
                  placeholder="e.g. Acme Technologies Ltd"
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
                  placeholder="billing@client.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN / Tax ID Number</label>
                <input
                  type="text"
                  value={clientTaxNumber}
                  onChange={(e) => setClientTaxNumber(e.target.value)}
                  placeholder="24AAACA1234F1Z5"
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
                placeholder="e.g. Suite 405, Infinity IT Hub, Race Course Rd"
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
                  placeholder="Vadodara"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={clientState}
                  onChange={(e) => setClientState(e.target.value)}
                  placeholder="Gujarat"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Postal / ZIP Code</label>
                <input
                  type="text"
                  value={clientPostalCode}
                  onChange={(e) => setClientPostalCode(e.target.value)}
                  placeholder="390022"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  value={clientCountry}
                  onChange={(e) => setClientCountry(e.target.value)}
                  placeholder="India"
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
                  <h3 className="text-sm font-bold text-slate-900">Invoice Items & Services</h3>
                  <p className="text-[11px] text-slate-500">Add deliverables, products, quantities, and pricing</p>
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

            {/* Line items table */}
            <div className="space-y-3">
              {items.map((it, idx) => {
                const lineTotal = Math.max(0, (Number(it.quantity) || 0) * (Number(it.rate) || 0) - (Number(it.discount) || 0));
                return (
                  <div
                    key={it.id}
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
                          placeholder="e.g. Dedicated Engineering Retainer"
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
                        placeholder="e.g. Scope, deliverables, milestone specifications, or hourly breakdown..."
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
                            placeholder="0"
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
              <span>Add Another Line Item</span>
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
                <p className="text-[11px] text-slate-500">Customer message, bank transfer instructions, and legal policies</p>
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
          {/* Sticky Financial Summary Card */}
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

            {/* Calculations Breakdown */}
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
                    placeholder="Discount value"
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
                  placeholder="0.00"
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

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSaveInvoice(false)}
                className="w-full py-2.5 bg-[#0f365e] hover:bg-[#164677] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Saving...' : 'Save & Issue Invoice'}</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSaveInvoice(true)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                <span>Save as Draft</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ADD CLIENT MODAL */}
      <Modal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        title="Add New Client to Directory"
      >
        <form onSubmit={handleCreateQuickClient} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person Name *</label>
              <input
                type="text"
                required
                value={newCName}
                onChange={(e) => setNewCName(e.target.value)}
                placeholder="e.g. Vikramaditya Rao"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                value={newCCompany}
                onChange={(e) => setNewCCompany(e.target.value)}
                placeholder="e.g. Global Logistics Corp"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={newCEmail}
                onChange={(e) => setNewCEmail(e.target.value)}
                placeholder="billing@company.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={newCPhone}
                onChange={(e) => setNewCPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">GST / Tax Number</label>
              <input
                type="text"
                value={newCTax}
                onChange={(e) => setNewCTax(e.target.value)}
                placeholder="24AAACA1234F1Z5"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={newCCity}
                onChange={(e) => setNewCCity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Billing Street Address</label>
            <input
              type="text"
              value={newCAddress}
              onChange={(e) => setNewCAddress(e.target.value)}
              placeholder="e.g. 102 Business Plaza, Lower Parel"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddClientModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingClient}
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
            >
              {creatingClient ? 'Saving Client...' : 'Save & Select Client'}
            </button>
          </div>
        </form>
      </Modal>

      {/* LIVE INVOICE PREVIEW MODAL */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title={`Live Preview: ${invoiceNumber}`}
      >
        <div className="max-h-[75vh] overflow-y-auto pt-8 pb-6 px-6 bg-white border border-slate-200 shadow-sm space-y-6 text-xs text-slate-800">
          <div className="flex justify-between items-start pt-2">
            <div>
              <img
                src={user?.organization_logo || '/images/logoblue.png'}
                alt="BLUEBOXX DA"
                className="h-14 max-w-[220px] object-contain mb-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/Boxxlogo.png';
                }}
              />
            </div>
            <div className="text-right">
              <div className="bg-[#269784] text-white font-extrabold text-sm tracking-wider px-4 py-1.5 uppercase inline-block">
                PERFORMA INVOICE
              </div>
              <div className="text-xs text-slate-500 mt-1.5">
                Bill date: {invoiceDate}
              </div>
            </div>
          </div>

          <hr className="border-t border-slate-200 my-2" />

          <div className="grid grid-cols-2 gap-6 text-xs text-slate-700">
            <div>
              <div className="font-bold text-slate-900 text-sm mb-1">Blueboxx DA</div>
              <p className="text-slate-600">02, India Bulls Mall, Jetalpur Road, Vadodara</p>
              <p className="text-slate-600">Phone: 9023512853</p>
              <p className="text-slate-600">Website: http://www.blueboxx.in/</p>
            </div>

            <div>
              <div className="font-bold text-slate-900 text-sm mb-1">Bill To</div>
              <div className="font-semibold text-slate-900">{clientName || clientCompanyName || 'Client Name'}</div>
              {clientCompanyName && clientName && <div className="text-slate-700">{clientCompanyName}</div>}
              {clientAddress && <div className="text-slate-600">{clientAddress}</div>}
              <div className="text-slate-600">{clientCity}{clientState ? `, ${clientState}` : ''} {clientPostalCode} {clientCountry}</div>
              {clientPhone && <div className="text-slate-600">Phone: {clientPhone}</div>}
            </div>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#269784] text-white font-bold text-xs">
                <th className="py-2 px-3">Item</th>
                <th className="py-2 px-3 text-center w-24">Quantity</th>
                <th className="py-2 px-3 text-right w-28">Rate</th>
                <th className="py-2 px-3 text-right w-32">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it, i) => (
                <tr key={i} className={i % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900">{it.item_name || 'Item Name'}</div>
                    {it.description && <div className="text-[11px] text-slate-500">{it.description}</div>}
                  </td>
                  <td className="py-2.5 px-3 text-center">{it.quantity}</td>
                  <td className="py-2.5 px-3 text-right">{formatCurrency(it.rate, currency)}</td>
                  <td className="py-2.5 px-3 text-right font-medium">
                    {formatCurrency(Math.max(0, (Number(it.quantity) || 0) * (Number(it.rate) || 0) - (Number(it.discount) || 0)), currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end text-xs">
            <div className="w-72 space-y-1.5">
              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-700">
                <span>Sub Total</span>
                <span className="font-mono">{formatCurrency(subtotal, currency)}</span>
              </div>
              {paidAmount > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-700">
                  <span>Paid</span>
                  <span className="font-mono">{formatCurrency(paidAmount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 bg-[#269784] text-white px-3 font-bold mt-1">
                <span>Balance Due</span>
                <span className="font-mono">{formatCurrency(balanceDue, currency)}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
            >
              Close Preview
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPreviewModalOpen(false);
                handleSaveInvoice(false);
              }}
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
            >
              Confirm & Issue Invoice
            </button>
          </div>
        </div>
      </Modal>

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </PortalLayout>
  );
}
