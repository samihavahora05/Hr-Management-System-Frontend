'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { fetchApi } from '@/lib/api';
import { exportToCSV } from '@/lib/export';
import { Toast } from '@/components/ui/Toast';
import { Download } from '@/components/ui/Icon';

export default function HRPayrollPage() {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthYear, setMonthYear] = useState('2026-08');
  const [processing, setProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadPayroll();
  }, [monthYear]);

  const loadPayroll = async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/payroll?month_year=${monthYear}`);
      setPayrolls(res.payrolls || res.payroll_records || []);
    } catch (err) {
      setToastMessage('Failed to load payroll records');
    } finally {
      setLoading(false);
    }
  };

  const handleRunPayroll = async () => {
    setProcessing(true);
    try {
      const res = await fetchApi('/payroll/generate', {
        method: 'POST',
        body: JSON.stringify({ month_year: monthYear }),
      });
      setToastMessage(res.message || 'Payroll generated successfully!');
      await loadPayroll();
    } catch (err: any) {
      setToastMessage(err.message || 'Payroll generation failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await fetchApi(`/payroll/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      setToastMessage(`Payroll status updated to ${status}`);
      await loadPayroll();
    } catch (err: any) {
      setToastMessage(err.message || 'Status update failed');
    }
  };

  const handleExportExcel = () => {
    if (payrolls.length === 0) {
      setToastMessage('No payroll data available to export for selected month.');
      return;
    }
    const headers = ['Employee Name', 'Code', 'Month/Year', 'Gross Salary (₹)', 'Total Deductions (₹)', 'Net Salary (₹)', 'Status', 'Paid Date'];
    const rows = payrolls.map((p) => [
      p.user?.name || `Employee #${p.user_id}`,
      p.user?.employee_code || '',
      p.month_year,
      p.gross_salary,
      p.total_deductions,
      p.net_salary,
      p.status,
      p.paid_at ? p.paid_at.slice(0, 10) : 'Pending',
    ]);
    exportToCSV(`Payroll_Records_${monthYear}`, headers, rows);
    setToastMessage(`Payroll report for ${monthYear} exported to Excel CSV format successfully!`);
  };

  return (
    <PortalLayout namespace="hr">
      <PageHeader
        title="Organization Payroll Processing"
        description="Automated monthly payroll runs, salary structures, deductions, and payslip dispatch"
        action={
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800"
            />
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              title="Export payroll records to Excel CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export to Excel</span>
            </button>
            <button
              onClick={handleRunPayroll}
              disabled={processing}
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{processing ? 'Processing Payroll...' : 'Run Monthly Payroll'}</span>
            </button>
          </div>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium">
            Loading monthly payroll records...
          </div>
        ) : payrolls.length === 0 ? (
          <div className="p-12 text-center rounded-xl">
            <p className="text-sm font-extrabold text-slate-800 mb-1">No Payroll Generated for {monthYear}</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Click &quot;Run Monthly Payroll&quot; above to calculate gross pay, tax deductions, and net salary for all active employees.
            </p>
            <button
              onClick={handleRunPayroll}
              disabled={processing}
              className="px-4 py-2 bg-[#0f365e] text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Run Payroll Now
            </button>
          </div>
        ) : (
          <TablePrimitive
            headers={['Employee', 'Month', 'Gross Pay', 'Deductions', 'Net Salary', 'Status', 'Actions']}
            rows={payrolls.map((p) => [
              <div key="emp">
                <p className="font-extrabold text-slate-900 text-xs">{p.user?.name || `Employee #${p.user_id}`}</p>
                <p className="text-[10px] font-mono text-slate-400">{p.user?.employee_code || ''}</p>
              </div>,
              <span key="m" className="font-mono text-xs text-slate-600 font-bold">{p.month_year}</span>,
              <span key="gross" className="font-mono text-xs text-slate-800">₹{Number(p.gross_salary).toLocaleString()}</span>,
              <span key="ded" className="font-mono text-xs text-rose-600">₹{Number(p.total_deductions).toLocaleString()}</span>,
              <span key="net" className="font-mono text-xs font-extrabold text-emerald-700">₹{Number(p.net_salary).toLocaleString()}</span>,
              <Badge key="status" variant={p.status === 'paid' ? 'green' : p.status === 'processed' ? 'blue' : 'yellow'}>
                {p.status}
              </Badge>,
              <div key="act" className="flex items-center gap-1">
                {p.status === 'draft' && (
                  <button
                    onClick={() => handleUpdateStatus(p.id, 'processed')}
                    className="px-2 py-1 bg-[#0f365e] text-white text-[10px] font-bold rounded cursor-pointer"
                  >
                    Mark Processed
                  </button>
                )}
                {p.status === 'processed' && (
                  <button
                    onClick={() => handleUpdateStatus(p.id, 'paid')}
                    className="px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded cursor-pointer"
                  >
                    Mark Paid
                  </button>
                )}
                {p.status === 'paid' && (
                  <span className="text-[10px] font-mono text-slate-400">Paid on {p.paid_at?.slice(0, 10)}</span>
                )}
              </div>,
            ])}
          />
        )}
      </div>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
