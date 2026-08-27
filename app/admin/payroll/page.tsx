'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Toast } from '@/components/ui/Toast';
import { SalarySlipModal } from '@/components/payroll/SalarySlipModal';
import { fetchApi } from '@/lib/api';
import {
  CreditCard,
  Download,
  Plus,
  Printer,
  CheckCircle,
  FileText,
  Users,
  Search,
  Sparkles,
  Edit3,
  Trash2,
} from '@/components/ui/Icon';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = [2024, 2025, 2026, 2027];

export default function AdminPayrollPage() {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    total_amount: 0,
    total_records: 0,
    paid_count: 0,
    generated_count: 0,
    draft_count: 0,
  });
  const [departments, setDepartments] = useState<string[]>([]);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const currentMonthName = MONTHS[new Date().getMonth()];
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthName);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Bulk Generation Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkMonth, setBulkMonth] = useState<string>(currentMonthName);
  const [bulkYear, setBulkYear] = useState<number>(currentYear);
  const [bulkPayDate, setBulkPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bulkPaymentMode, setBulkPaymentMode] = useState<string>('bank_transfer');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Single Create / Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPayrollId, setEditingPayrollId] = useState<number | null>(null);
  const [formEmployeeId, setFormEmployeeId] = useState<string | number>('');
  const [formMonth, setFormMonth] = useState<string>(currentMonthName);
  const [formYear, setFormYear] = useState<number>(currentYear);
  const [formPayDate, setFormPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formPaymentMode, setFormPaymentMode] = useState<string>('bank_transfer');
  const [formEarnings, setFormEarnings] = useState<any[]>([]);
  const [formDeductions, setFormDeductions] = useState<any[]>([]);
  const [formNotes, setFormNotes] = useState<string>('');
  const [savingPayroll, setSavingPayroll] = useState(false);

  // Salary Slip Modal State
  const [selectedSlipData, setSelectedSlipData] = useState<any>(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);

  // Confirm Mark Paid State
  const [confirmPaidItem, setConfirmPaidItem] = useState<any | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadPayrolls();
    loadEmployees();
  }, [selectedMonth, selectedYear, selectedDepartment, selectedStatus]);

  const loadPayrolls = async () => {
    setLoading(true);
    try {
      let query = `?month=${selectedMonth}&year=${selectedYear}`;
      if (selectedDepartment !== 'all') query += `&department=${encodeURIComponent(selectedDepartment)}`;
      if (selectedStatus !== 'all') query += `&status=${selectedStatus}`;
      if (searchQuery) query += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetchApi(`/payroll${query}`);
      setPayrolls(res.payrolls || []);
      if (res.metrics) setMetrics(res.metrics);
      if (res.departments) setDepartments(res.departments);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to load payroll records');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await fetchApi('/employees');
      if (res.employees) {
        setEmployeesList(res.employees);
        if (res.employees.length > 0 && !formEmployeeId) {
          setFormEmployeeId(res.employees[0].id);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const handleOpenCreateModal = () => {
    setEditingPayrollId(null);
    setFormMonth(selectedMonth);
    setFormYear(selectedYear);
    setFormPayDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMode('bank_transfer');
    setFormNotes('');

    // Prepopulate default items based on chosen employee
    const emp = employeesList.find((e) => Number(e.id) === Number(formEmployeeId)) || employeesList[0];
    const base = Number(emp?.base_salary || 60000);
    setFormEarnings([
      { particulars: 'Basic Salary', amount: Number(base * 0.50).toFixed(2) },
      { particulars: 'Dearness Allowance (DA)', amount: Number(base * 0.10).toFixed(2) },
      { particulars: 'House Rent Allowance (HRA)', amount: Number(base * 0.20).toFixed(2) },
      { particulars: 'Conveyance Allowance', amount: Number(base * 0.05).toFixed(2) },
      { particulars: 'Special Allowance', amount: Number(base * 0.15).toFixed(2) },
      { particulars: 'Other Allowance', amount: '0.00' },
    ]);
    setFormDeductions([
      { particulars: 'Provident Fund (PF)', amount: '1800.00' },
      { particulars: 'Employee State Insurance (ESI)', amount: '0.00' },
      { particulars: 'Professional Tax (PT)', amount: '200.00' },
      { particulars: 'Income Tax (TDS)', amount: base > 80000 ? Number((base - 50000) * 0.10).toFixed(2) : '0.00' },
      { particulars: 'Other Deductions', amount: '0.00' },
    ]);
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (p: any) => {
    if (p.status === 'paid') {
      setToastMessage('Cannot edit a payroll record that has already been marked as Paid.');
      return;
    }
    setEditingPayrollId(p.id);
    setFormEmployeeId(p.employee_id);
    setFormMonth(p.pay_period_month);
    setFormYear(p.pay_period_year);
    setFormPayDate(p.pay_date ? p.pay_date.split('T')[0] : '');
    setFormPaymentMode(p.payment_mode || 'bank_transfer');
    setFormEarnings(p.earnings || []);
    setFormDeductions(p.deductions || []);
    setFormNotes(p.notes || '');
    setIsEditModalOpen(true);
  };

  const handleSavePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPayroll(true);
    try {
      if (editingPayrollId) {
        await fetchApi(`/payroll/${editingPayrollId}`, {
          method: 'PUT',
          body: JSON.stringify({
            earnings: formEarnings,
            deductions: formDeductions,
            pay_date: formPayDate,
            payment_mode: formPaymentMode,
            notes: formNotes,
          }),
        });
        setToastMessage('Payroll record updated successfully');
      } else {
        await fetchApi('/payroll', {
          method: 'POST',
          body: JSON.stringify({
            employee_id: formEmployeeId,
            pay_period_month: formMonth,
            pay_period_year: formYear,
            pay_date: formPayDate,
            payment_mode: formPaymentMode,
            earnings: formEarnings,
            deductions: formDeductions,
            notes: formNotes,
          }),
        });
        setToastMessage('Payroll record created successfully');
      }
      setIsEditModalOpen(false);
      await loadPayrolls();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to save payroll record');
    } finally {
      setSavingPayroll(false);
    }
  };

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkProcessing(true);
    try {
      const res = await fetchApi('/payroll/bulk-generate', {
        method: 'POST',
        body: JSON.stringify({
          pay_period_month: bulkMonth,
          pay_period_year: bulkYear,
          pay_date: bulkPayDate,
          payment_mode: bulkPaymentMode,
        }),
      });
      setToastMessage(res.message || 'Bulk payroll generated successfully!');
      setIsBulkModalOpen(false);
      setSelectedMonth(bulkMonth);
      setSelectedYear(bulkYear);
      await loadPayrolls();
    } catch (err: any) {
      setToastMessage(err.message || 'Bulk payroll generation failed');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleMarkPaid = (p: any) => {
    setConfirmPaidItem(p);
  };

  const executeMarkPaid = async () => {
    if (!confirmPaidItem) return;
    setMarkingPaid(true);
    try {
      await fetchApi(`/payroll/${confirmPaidItem.id}/mark-paid`, { method: 'POST' });
      setToastMessage('Payroll marked as Paid! Notification sent to employee.');
      setConfirmPaidItem(null);
      await loadPayrolls();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to mark as paid');
    } finally {
      setMarkingPaid(false);
    }
  };

  const handleViewSlip = async (id: number) => {
    try {
      const res = await fetchApi(`/payroll/${id}/slip-data`);
      if (res.slip) {
        setSelectedSlipData(res.slip);
        setIsSlipModalOpen(true);
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to load salary slip template');
    }
  };

  // Compute live totals inside modal
  const liveTotalEarnings = formEarnings.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const liveTotalDeductions = formDeductions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const liveNetSalary = Math.max(0, liveTotalEarnings - liveTotalDeductions);

  return (
    <PortalLayout namespace="admin">
      <PageHeader
        title="Organization Payroll & Salary Slips"
        description="Admin-level monthly salary generation, earnings & deductions configuration, and official PDF payslip disbursements."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Bulk Generate Active Staff</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Single Payroll</span>
            </button>
          </div>
        }
      />

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Net Payroll</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            ₹ {Number(metrics.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">For {selectedMonth} {selectedYear}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Disbursed (Paid)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600">
            {metrics.paid_count || 0}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Locked & notified to staff</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Pending Payment</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600">
            {metrics.generated_count || 0}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Generated drafts ready to pay</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Records</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {metrics.total_records || 0}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Covered in current filters</p>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 font-bold text-slate-800"
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 font-bold text-slate-800"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Department:</span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 font-medium"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="generated">Generated (Unpaid)</option>
              <option value="paid">Paid (Locked)</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search employee / code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadPayrolls()}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 w-56"
          />
          <button
            onClick={loadPayrolls}
            className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-800"
          >
            Search
          </button>
        </div>
      </div>

      {/* PAYROLL DATA TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium animate-pulse">
            Loading payroll records for {selectedMonth} {selectedYear}...
          </div>
        ) : payrolls.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-extrabold text-slate-800 text-sm">No Payroll Records Found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No salary slips generated for {selectedMonth} {selectedYear} matching current filter criteria.
            </p>
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Bulk Generate for All Active Staff</span>
            </button>
          </div>
        ) : (
          <TablePrimitive
            headers={[
              'Employee',
              'Period',
              'Gross Earnings',
              'Total Deductions',
              'Net Pay',
              'Mode',
              'Status',
              'Actions',
            ]}
            rows={payrolls.map((p) => [
              <div key="emp" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#081e3a] text-white flex items-center justify-center font-bold text-xs">
                  {p.employee?.name ? p.employee.name[0] : 'E'}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-xs">{p.employee?.name || 'Staff'}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {p.employee?.employee_code || `EMP-${p.employee_id}`} • {p.employee?.department || 'General'}
                  </p>
                </div>
              </div>,
              <span key="period" className="font-extrabold text-slate-800 text-xs">
                {p.pay_period_month} {p.pay_period_year}
              </span>,
              <span key="gross" className="font-mono text-xs text-slate-700">
                ₹ {Number(p.total_earnings || 0).toFixed(2)}
              </span>,
              <span key="ded" className="font-mono text-xs text-rose-600">
                ₹ {Number(p.total_deductions || 0).toFixed(2)}
              </span>,
              <span key="net" className="font-mono font-black text-xs text-[#081e3a]">
                ₹ {Number(p.net_salary || 0).toFixed(2)}
              </span>,
              <span key="mode" className="text-[11px] font-semibold text-slate-600 capitalize">
                {p.payment_mode ? p.payment_mode.replace('_', ' ') : 'Bank Transfer'}
              </span>,
              <Badge key="status" variant={p.status === 'paid' ? 'green' : 'yellow'}>
                {p.status}
              </Badge>,
              <div key="actions" className="flex items-center gap-1.5">
                {/* VIEW & PRINT OFFICIAL SLIP */}
                <button
                  onClick={() => handleViewSlip(p.id)}
                  className="px-2.5 py-1 bg-[#081e3a] hover:bg-[#10305a] text-white text-[11px] font-bold rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  title="View and Print Official PDF Salary Slip"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Salary Slip</span>
                </button>

                {/* EDIT LINE ITEMS (LOCKED IF PAID) */}
                {p.status !== 'paid' ? (
                  <>
                    <button
                      onClick={() => handleOpenEditModal(p)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                      title="Edit Earnings and Deductions"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMarkPaid(p)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                      title="Mark as Paid and notify employee"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Mark Paid</span>
                    </button>
                  </>
                ) : (
                  <span className="text-[10px] text-emerald-700 font-bold px-2 py-0.5 bg-emerald-50 rounded">
                    Disbursed
                  </span>
                )}
              </div>,
            ])}
          />
        )}
      </div>

      {/* BULK GENERATION MODAL */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Generate Payroll for All Active Staff"
        maxWidth="xl"
      >
        <form onSubmit={handleBulkGenerate} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            This will calculate earnings and statutory deductions for all currently active staff for the selected pay period. Paid records will not be overwritten.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pay Month <span className="text-rose-500">*</span></label>
              <select
                value={bulkMonth}
                onChange={(e) => setBulkMonth(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-bold"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pay Year <span className="text-rose-500">*</span></label>
              <select
                value={bulkYear}
                onChange={(e) => setBulkYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-bold"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pay Date <span className="text-rose-500">*</span></label>
              <input
                type="date"
                required
                value={bulkPayDate}
                onChange={(e) => setBulkPayDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Disbursement Mode</label>
              <select
                value={bulkPaymentMode}
                onChange={(e) => setBulkPaymentMode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="cheque">Company Cheque</option>
                <option value="cash">Cash</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={bulkProcessing}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {bulkProcessing ? 'Processing...' : 'Run Bulk Generation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* SINGLE CREATE / EDIT PAYROLL MODAL WITH LIVE CALCULATION */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={editingPayrollId ? 'Edit Payroll Line Items' : 'Create Single Employee Payroll'}
        maxWidth="4xl"
      >
        <form onSubmit={handleSavePayroll} className="space-y-5">
          {/* Employee Picker */}
          {!editingPayrollId ? (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-black text-[#081e3a] uppercase tracking-wider mb-1.5">
                Select Employee <span className="text-rose-500">*</span>
              </label>
              <select
                value={formEmployeeId}
                onChange={(e) => {
                  setFormEmployeeId(e.target.value);
                  const emp = employeesList.find((em) => Number(em.id) === Number(e.target.value));
                  if (emp) {
                    const base = Number(emp.base_salary || 60000);
                    setFormEarnings([
                      { particulars: 'Basic Salary', amount: Number(base * 0.50).toFixed(2) },
                      { particulars: 'Dearness Allowance (DA)', amount: Number(base * 0.10).toFixed(2) },
                      { particulars: 'House Rent Allowance (HRA)', amount: Number(base * 0.20).toFixed(2) },
                      { particulars: 'Conveyance Allowance', amount: Number(base * 0.05).toFixed(2) },
                      { particulars: 'Special Allowance', amount: Number(base * 0.15).toFixed(2) },
                      { particulars: 'Other Allowance', amount: '0.00' },
                    ]);
                    setFormDeductions([
                      { particulars: 'Provident Fund (PF)', amount: '1800.00' },
                      { particulars: 'Employee State Insurance (ESI)', amount: '0.00' },
                      { particulars: 'Professional Tax (PT)', amount: '200.00' },
                      { particulars: 'Income Tax (TDS)', amount: base > 80000 ? Number((base - 50000) * 0.10).toFixed(2) : '0.00' },
                      { particulars: 'Other Deductions', amount: '0.00' },
                    ]);
                  }
                }}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-white font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
              >
                {employeesList.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employee_code || `EMP-${emp.id}`} • {emp.department || 'General'} — Base CTC: ₹{Number(emp.base_salary || 50000).toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {/* Period & Payment Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Pay Month</label>
              <select
                disabled={!!editingPayrollId}
                value={formMonth}
                onChange={(e) => setFormMonth(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 font-semibold"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Pay Year</label>
              <select
                disabled={!!editingPayrollId}
                value={formYear}
                onChange={(e) => setFormYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 font-semibold"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Pay Date <span className="text-rose-500">*</span></label>
              <input
                type="date"
                required
                value={formPayDate}
                onChange={(e) => setFormPayDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Disbursement Mode</label>
              <select
                value={formPaymentMode}
                onChange={(e) => setFormPaymentMode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 font-semibold"
              >
                <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="cheque">Company Cheque</option>
                <option value="cash">Cash</option>
              </select>
            </div>
          </div>

          {/* TWO COLUMNS: EARNINGS & DEDUCTIONS LINE ITEMS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* EARNINGS COLUMN */}
            <div className="border-2 border-emerald-200/80 rounded-xl overflow-hidden bg-white shadow-2xs flex flex-col">
              <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="font-black text-emerald-900 text-xs uppercase tracking-wider block">Earnings Particulars</span>
                  <span className="text-[10px] text-emerald-700">Allowances & base compensation</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormEarnings([...formEarnings, { particulars: 'Special Allowance', amount: '0.00' }])}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-2xs cursor-pointer"
                >
                  + Add Earning
                </button>
              </div>

              <div className="p-3 space-y-2 flex-1 max-h-60 overflow-y-auto">
                {formEarnings.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.particulars}
                      onChange={(e) => {
                        const updated = [...formEarnings];
                        updated[idx].particulars = e.target.value;
                        setFormEarnings(updated);
                      }}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                      placeholder="e.g. Basic Salary"
                    />
                    <div className="relative w-32 shrink-0">
                      <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) => {
                          const updated = [...formEarnings];
                          updated[idx].amount = e.target.value;
                          setFormEarnings(updated);
                        }}
                        className="w-full pl-6 pr-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-right font-mono font-bold focus:bg-white"
                        placeholder="0.00"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormEarnings(formEarnings.filter((_, i) => i !== idx))}
                      className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove line"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-emerald-50/70 px-4 py-2.5 border-t border-emerald-200 flex items-center justify-between font-black text-xs text-emerald-950">
                <span>TOTAL EARNINGS (A):</span>
                <span className="font-mono text-sm">₹ {liveTotalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* DEDUCTIONS COLUMN */}
            <div className="border-2 border-rose-200/80 rounded-xl overflow-hidden bg-white shadow-2xs flex flex-col">
              <div className="bg-rose-50 px-4 py-2.5 border-b border-rose-200 flex items-center justify-between">
                <div>
                  <span className="font-black text-rose-900 text-xs uppercase tracking-wider block">Deductions Particulars</span>
                  <span className="text-[10px] text-rose-700">Taxes, PF & statutory debits</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormDeductions([...formDeductions, { particulars: 'Other Deduction', amount: '0.00' }])}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg shadow-2xs cursor-pointer"
                >
                  + Add Deduction
                </button>
              </div>

              <div className="p-3 space-y-2 flex-1 max-h-60 overflow-y-auto">
                {formDeductions.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.particulars}
                      onChange={(e) => {
                        const updated = [...formDeductions];
                        updated[idx].particulars = e.target.value;
                        setFormDeductions(updated);
                      }}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                      placeholder="e.g. Provident Fund"
                    />
                    <div className="relative w-32 shrink-0">
                      <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) => {
                          const updated = [...formDeductions];
                          updated[idx].amount = e.target.value;
                          setFormDeductions(updated);
                        }}
                        className="w-full pl-6 pr-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-right font-mono font-bold focus:bg-white text-rose-600"
                        placeholder="0.00"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormDeductions(formDeductions.filter((_, i) => i !== idx))}
                      className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove line"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-rose-50/70 px-4 py-2.5 border-t border-rose-200 flex items-center justify-between font-black text-xs text-rose-950">
                <span>TOTAL DEDUCTIONS (B):</span>
                <span className="font-mono text-sm text-rose-700">₹ {liveTotalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* NET SALARY LIVE PREVIEW BANNER */}
          <div className="p-4 bg-gradient-to-r from-[#081e3a] to-[#163660] text-white rounded-xl flex items-center justify-between shadow-sm border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-xs">
                ₹
              </div>
              <div>
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">
                  Calculated Net Disbursed Salary (A − B)
                </span>
                <p className="text-2xl font-black font-mono tracking-tight text-white mt-0.5">
                  ₹ {liveNetSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="text-right max-w-sm hidden sm:block">
              <span className="text-[9px] text-amber-300 font-black uppercase tracking-wider block">Amount Status</span>
              <p className="text-xs text-slate-200 italic font-semibold mt-0.5">
                Ready for disbursement calculation
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Administrative Notes (Optional)</label>
            <input
              type="text"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="e.g. Approved with performance bonus..."
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex justify-end items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingPayroll}
              className="px-6 py-2.5 bg-[#081e3a] hover:bg-[#10305a] active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-all flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{savingPayroll ? 'Saving...' : 'Save & Calculate Payroll'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* OFFICIAL SALARY SLIP MODAL (PDF VIEW) */}
      <SalarySlipModal
        isOpen={isSlipModalOpen}
        onClose={() => setIsSlipModalOpen(false)}
        slipData={selectedSlipData}
      />

      {/* CUSTOM CONFIRMATION MODAL FOR MARK AS PAID */}
      <ConfirmModal
        isOpen={!!confirmPaidItem}
        onClose={() => setConfirmPaidItem(null)}
        onConfirm={executeMarkPaid}
        loading={markingPaid}
        title="Confirm Salary Disbursement"
        description="Are you sure you want to mark this salary slip as PAID? This action will lock line items from further edits and automatically notify the employee with their official payslip."
        variant="success"
        confirmText="Yes, Mark as Paid & Notify"
        details={
          confirmPaidItem && (
            <div className="space-y-2 text-slate-700 font-medium">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">Employee:</span>
                <span className="font-extrabold text-slate-900">
                  {confirmPaidItem.employee?.name} ({confirmPaidItem.employee?.employee_code || `EMP-${confirmPaidItem.employee_id}`})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">Pay Period:</span>
                <span className="font-extrabold text-slate-900">
                  {confirmPaidItem.pay_period_month} {confirmPaidItem.pay_period_year}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-2 font-bold text-emerald-800">
                <span className="text-slate-700">Net Disbursed Pay:</span>
                <span className="font-mono text-sm font-black">
                  ₹ {Number(confirmPaidItem.net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )
        }
      />

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
