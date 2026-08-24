'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { SalarySlipModal } from '@/components/payroll/SalarySlipModal';
import { fetchApi } from '@/lib/api';
import { CreditCard, Download, Printer, CheckCircle, FileText } from '@/components/ui/Icon';

export default function EmployeePayslipsPage() {
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlipData, setSelectedSlipData] = useState<any>(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadMyPayslips();
  }, []);

  const loadMyPayslips = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/employee/payslips');
      setPayslips(res.payslips || []);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to load personal payslips');
    } finally {
      setLoading(false);
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

  return (
    <PortalLayout namespace="employee">
      <PageHeader
        title="My Payslips & Compensation"
        description="View your historical monthly salary slips, breakdown of earnings and statutory deductions, and download official PDF payslips."
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium animate-pulse">
            Loading your historical salary slips...
          </div>
        ) : payslips.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-extrabold text-slate-800 text-sm">No Payslips Available</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Your official monthly salary slips will appear here as soon as management disburses them.
            </p>
          </div>
        ) : (
          <TablePrimitive
            headers={[
              'Pay Period',
              'Gross Earnings',
              'Total Deductions',
              'Net Pay',
              'Disbursement Mode',
              'Payment Status',
              'Actions',
            ]}
            rows={payslips.map((p) => [
              <div key="period">
                <p className="font-black text-[#081e3a] text-xs">
                  {p.pay_period_month} {p.pay_period_year}
                </p>
                <p className="text-[10px] text-slate-400">Paid on: {p.pay_date || 'N/A'}</p>
              </div>,
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
              <button
                key="actions"
                onClick={() => handleViewSlip(p.id)}
                className="px-3 py-1.5 bg-[#081e3a] hover:bg-[#10305a] text-white text-[11px] font-bold rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                title="View & Download Official PDF Salary Slip"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Download / Print PDF</span>
              </button>,
            ])}
          />
        )}
      </div>

      {/* SALARY SLIP MODAL */}
      <SalarySlipModal
        isOpen={isSlipModalOpen}
        onClose={() => setIsSlipModalOpen(false)}
        slipData={selectedSlipData}
      />

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
