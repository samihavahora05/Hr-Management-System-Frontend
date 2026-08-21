'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { fetchApi } from '@/lib/api';
import { Toast } from '@/components/ui/Toast';
import { Download } from '@/components/ui/Icon';

export default function EmployeePayrollPage() {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchApi('/payroll')
      .then((res) => setPayrolls(res.payrolls || []))
      .catch(() => setToastMessage('Failed to load payslip records'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PortalLayout namespace="employee">
      <PageHeader
        title="My Payslips & Salary Statements"
        description="Access and download your monthly salary statements, gross pay breakdown, and tax deductions"
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium">
            Fetching your salary statements...
          </div>
        ) : payrolls.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">
            No processed payslips found for your account.
          </div>
        ) : (
          <TablePrimitive
            headers={['Pay Period', 'Gross Salary', 'Total Deductions', 'Net Pay', 'Status', 'Download Payslip']}
            rows={payrolls.map((p) => [
              <span key="period" className="font-mono text-xs text-slate-900 font-bold">{p.month_year}</span>,
              <span key="gross" className="font-mono text-xs text-slate-700">₹{p.gross_salary?.toLocaleString()}</span>,
              <span key="ded" className="font-mono text-xs text-rose-600">₹{p.total_deductions?.toLocaleString()}</span>,
              <span key="net" className="font-mono text-xs font-extrabold text-emerald-700">₹{p.net_salary?.toLocaleString()}</span>,
              <Badge key="status" variant={p.status === 'paid' ? 'green' : 'gray'}>
                {p.status}
              </Badge>,
              <a
                key="dl"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setToastMessage(`Downloading Payslip PDF for ${p.month_year}`);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF Payslip</span>
              </a>,
            ])}
          />
        )}
      </div>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
