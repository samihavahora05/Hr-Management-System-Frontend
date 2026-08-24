'use client';

import React, { useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Download, Printer, CheckCircle, ShieldCheck, Building2, User } from '@/components/ui/Icon';

interface SalarySlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  slipData: any;
}

export function SalarySlipModal({ isOpen, onClose, slipData }: SalarySlipModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!slipData) return null;

  const {
    id,
    pay_period_month,
    pay_period_year,
    pay_date,
    payment_mode,
    status,
    earnings = [],
    deductions = [],
    total_earnings = 0,
    total_deductions = 0,
    net_salary = 0,
    net_salary_words = '',
    employee = {},
    company = {},
  } = slipData;

  const handlePrint = () => {
    window.print();
  };

  // Pad table rows so earnings and deductions have equal rows
  const maxRows = Math.max(earnings.length, deductions.length, 6);
  const paddedEarnings = [...earnings];
  const paddedDeductions = [...deductions];
  while (paddedEarnings.length < maxRows) {
    paddedEarnings.push({ particulars: '', amount: '' });
  }
  while (paddedDeductions.length < maxRows) {
    paddedDeductions.push({ particulars: '', amount: '' });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Salary Slip #${id} — ${employee.name} (${pay_period_month} ${pay_period_year})`}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* ACTION BAR */}
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Pay Period:</span>
            <span className="px-2.5 py-0.5 bg-[#081e3a] text-white font-extrabold text-xs rounded-md">
              {pay_period_month} {pay_period_year}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
              status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#081e3a] hover:bg-[#10305a] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>

        {/* PRINTABLE SALARY SLIP CANVAS */}
        <div
          ref={printRef}
          id="salary-slip-printable"
          className="bg-white text-slate-900 p-8 rounded-2xl border border-slate-300 shadow-sm max-w-4xl mx-auto print:border-none print:p-0 print:shadow-none print:max-w-none print:w-full font-sans text-xs"
        >
          {/* HEADER ROW: LOGO & COMPANY NAME ON LEFT, SALARY SLIP BADGE ON RIGHT */}
          <div className="flex items-start justify-between gap-4 pb-4">
            <div className="flex items-center gap-3.5">
              {/* BRAND LOGO EMBLEM */}
              <div className="w-14 h-14 bg-gradient-to-br from-[#081e3a] via-[#10305a] to-[#e69a0e] rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-md shrink-0 border-2 border-amber-400">
                B
              </div>
              <div>
                <h1 className="font-black text-2xl tracking-tight text-[#081e3a] uppercase leading-none">
                  {company.name || 'BLUEBOXX DA PVT. LTD.'}
                </h1>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1.5">
                  {company.tagline || 'LEARNING TODAY, LEADING TOMORROW'}
                </p>
              </div>
            </div>

            {/* ANGLED SALARY SLIP BADGE */}
            <div className="relative shrink-0">
              <div className="bg-[#081e3a] text-white px-8 py-2.5 rounded-r-lg font-black text-base tracking-wider uppercase flex items-center gap-2 relative shadow-sm skew-x-[-12deg]">
                <span className="skew-x-[12deg]">SALARY SLIP</span>
              </div>
              <div className="absolute top-0 -right-2 w-2 h-full bg-[#e69a0e] rounded-r-sm skew-x-[-12deg]" />
            </div>
          </div>

          {/* GOLD DIVIDER */}
          <div className="h-0.5 bg-[#e69a0e] w-full my-2" />

          {/* COMPANY CONTACT DETAILS & PAY INFO BOX */}
          <div className="grid grid-cols-12 gap-4 py-3 items-center">
            {/* Contact Details */}
            <div className="col-span-7 space-y-1 text-[11px] text-slate-700">
              <p className="flex items-center gap-2 font-medium">
                <span className="text-[#081e3a] font-bold">📍</span>
                <span>{company.address || 'SF-02, India Bulls Mega Mall, Akota Road, Vadodara, Gujarat 390022.'}</span>
              </p>
              <p className="flex items-center gap-2 font-medium">
                <span className="text-[#081e3a] font-bold">🌐</span>
                <span className="text-[#081e3a] underline">{company.website || 'https://blueboxx.in/'}</span>
              </p>
              <p className="flex items-center gap-2 font-medium">
                <span className="text-[#081e3a] font-bold">✉️</span>
                <span>{company.email || 'info.blueboxx@gmail.com'}</span>
              </p>
              <p className="flex items-center gap-2 font-medium">
                <span className="text-[#081e3a] font-bold">📞</span>
                <span>{company.phone || '9023512853 | 6352524266'}</span>
              </p>
            </div>

            {/* Right Info Box */}
            <div className="col-span-5 border border-slate-300 rounded-lg overflow-hidden text-[11px] bg-slate-50/50">
              <div className="flex border-b border-slate-200 p-2">
                <span className="font-extrabold text-[#081e3a] w-1/2 uppercase text-[10px]">PAY SLIP FOR MONTH OF</span>
                <span className="font-bold text-slate-800 w-1/2 text-right">{pay_period_month} {pay_period_year}</span>
              </div>
              <div className="flex border-b border-slate-200 p-2">
                <span className="font-extrabold text-[#081e3a] w-1/2 uppercase text-[10px]">PAY DATE</span>
                <span className="font-bold text-slate-800 w-1/2 text-right">{pay_date}</span>
              </div>
              <div className="flex p-2">
                <span className="font-extrabold text-[#081e3a] w-1/2 uppercase text-[10px]">PAYMENT MODE</span>
                <span className="font-bold text-slate-800 w-1/2 text-right">{payment_mode}</span>
              </div>
            </div>
          </div>

          {/* EMPLOYEE INFO BLOCK */}
          <div className="my-3 border-2 border-[#081e3a] rounded-xl flex items-stretch overflow-hidden bg-white">
            {/* Left User Icon Badge */}
            <div className="w-20 bg-[#081e3a] text-white flex items-center justify-center shrink-0">
              <User className="w-10 h-10 text-white" />
            </div>

            {/* 2-Column Dotted Fields */}
            <div className="flex-1 p-3 grid grid-cols-2 gap-x-6 gap-y-2 text-[11px]">
              <div className="flex items-center justify-between border-b border-dotted border-slate-300 pb-0.5">
                <span className="font-black text-[#081e3a] uppercase text-[10px] w-36">EMPLOYEE NAME :</span>
                <span className="font-bold text-slate-900 truncate">{employee.name || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-dotted border-slate-300 pb-0.5">
                <span className="font-black text-[#081e3a] uppercase text-[10px] w-36">DATE OF JOINING :</span>
                <span className="font-bold text-slate-900">{employee.joining_date || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-dotted border-slate-300 pb-0.5">
                <span className="font-black text-[#081e3a] uppercase text-[10px] w-36">EMPLOYEE ID :</span>
                <span className="font-bold text-slate-900 font-mono">{employee.employee_id || `EMP-${id}`}</span>
              </div>

              <div className="flex items-center justify-between border-b border-dotted border-slate-300 pb-0.5">
                <span className="font-black text-[#081e3a] uppercase text-[10px] w-36">PAN NUMBER :</span>
                <span className="font-bold text-slate-900 font-mono">{employee.pan_number || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-dotted border-slate-300 pb-0.5">
                <span className="font-black text-[#081e3a] uppercase text-[10px] w-36">DESIGNATION :</span>
                <span className="font-bold text-slate-900 truncate">{employee.designation || 'Staff'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-dotted border-slate-300 pb-0.5">
                <span className="font-black text-[#081e3a] uppercase text-[10px] w-36">BANK NAME :</span>
                <span className="font-bold text-slate-900">{employee.bank_name || 'HDFC Bank'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-dotted border-slate-300 pb-0.5">
                <span className="font-black text-[#081e3a] uppercase text-[10px] w-36">DEPARTMENT :</span>
                <span className="font-bold text-slate-900 truncate">{employee.department || 'General'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-dotted border-slate-300 pb-0.5">
                <span className="font-black text-[#081e3a] uppercase text-[10px] w-36">BANK A/C NO. :</span>
                <span className="font-bold text-slate-900 font-mono">{employee.bank_account_no || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* TWO-COLUMN EARNINGS VS DEDUCTIONS TABLE */}
          <div className="my-3 border-2 border-[#081e3a] rounded-xl overflow-hidden text-[11px]">
            <div className="grid grid-cols-2 bg-[#081e3a] text-white font-black text-xs uppercase tracking-wider divide-x-2 divide-white">
              <div className="py-1.5 text-center">EARNINGS</div>
              <div className="py-1.5 text-center">DEDUCTIONS</div>
            </div>

            {/* Sub-header row */}
            <div className="grid grid-cols-12 bg-[#e8f1fb] text-[#081e3a] font-extrabold text-[10px] uppercase border-b border-slate-300 divide-x divide-slate-300">
              <div className="col-span-4 p-1.5 pl-3">PARTICULARS</div>
              <div className="col-span-2 p-1.5 text-right pr-3">AMOUNT (₹)</div>
              <div className="col-span-4 p-1.5 pl-3">PARTICULARS</div>
              <div className="col-span-2 p-1.5 text-right pr-3">AMOUNT (₹)</div>
            </div>

            {/* Data Rows */}
            <div className="divide-y divide-slate-200">
              {paddedEarnings.map((earn, idx) => {
                const ded = paddedDeductions[idx] || { particulars: '', amount: '' };
                return (
                  <div key={idx} className="grid grid-cols-12 divide-x divide-slate-200 text-slate-800">
                    <div className="col-span-4 p-1.5 pl-3 font-semibold">{earn.particulars}</div>
                    <div className="col-span-2 p-1.5 text-right pr-3 font-mono font-medium">
                      {earn.amount !== '' && earn.amount !== undefined ? Number(earn.amount).toFixed(2) : ''}
                    </div>
                    <div className="col-span-4 p-1.5 pl-3 font-semibold">{ded.particulars}</div>
                    <div className="col-span-2 p-1.5 text-right pr-3 font-mono font-medium">
                      {ded.amount !== '' && ded.amount !== undefined ? Number(ded.amount).toFixed(2) : ''}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals Row */}
            <div className="grid grid-cols-12 bg-[#e8f1fb] text-[#081e3a] font-black text-[11px] border-t-2 border-[#081e3a] divide-x-2 divide-[#081e3a]">
              <div className="col-span-4 p-2 pl-3 uppercase">TOTAL EARNINGS (A)</div>
              <div className="col-span-2 p-2 text-right pr-3 font-mono">₹ {Number(total_earnings).toFixed(2)}</div>
              <div className="col-span-4 p-2 pl-3 uppercase">TOTAL DEDUCTIONS (B)</div>
              <div className="col-span-2 p-2 text-right pr-3 font-mono">₹ {Number(total_deductions).toFixed(2)}</div>
            </div>
          </div>

          {/* NET SALARY HIGHLIGHT BOX */}
          <div className="my-4 border-2 border-[#081e3a] rounded-xl overflow-hidden flex items-center bg-white shadow-2xs">
            {/* Left Dark Blue Badge */}
            <div className="bg-[#081e3a] text-white p-3.5 flex items-center gap-3 w-56 shrink-0">
              <div className="w-9 h-9 rounded-full bg-white text-[#081e3a] flex items-center justify-center font-black text-lg shrink-0">
                ₹
              </div>
              <div className="leading-tight">
                <span className="font-black text-xs block uppercase">NET SALARY</span>
                <span className="text-[10px] font-bold text-slate-300">(A − B)</span>
              </div>
            </div>

            {/* Center Big Number */}
            <div className="px-6 py-2 border-r border-slate-200 shrink-0">
              <span className="font-black text-2xl text-[#081e3a] tracking-tight">
                ₹ {Number(net_salary).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Right Amount in Words */}
            <div className="flex-1 px-4 py-2 text-[11px]">
              <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">AMOUNT IN WORDS</span>
              <p className="font-extrabold text-slate-800 italic mt-0.5">
                {net_salary_words || 'Rupees Zero Only'}
              </p>
            </div>
          </div>

          {/* FOOTER & SEAL / SIGNATORY BLOCK */}
          <div className="pt-6 mt-6 border-t border-slate-200 grid grid-cols-12 gap-4 items-end">
            {/* Left Disclaimer */}
            <div className="col-span-5 text-[10px] text-slate-500 italic space-y-1">
              <p>This is a computer generated payslip and does not require any signature.</p>
              <p className="font-bold text-[#081e3a] not-italic">Thank you for your contribution!</p>
            </div>

            {/* Center Circular Stamp */}
            <div className="col-span-3 flex justify-center">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#10305a] p-1 flex flex-col items-center justify-center text-center text-[7px] font-black text-[#10305a] uppercase leading-tight transform -rotate-6">
                <span>{company.name || 'BLUEBOXX DA'}</span>
                <span className="text-[8px] my-0.5">★</span>
                <span>{company.city || 'VADODARA'}</span>
                <span>{company.state || 'GUJARAT'}</span>
              </div>
            </div>

            {/* Right Authorized Signatory */}
            <div className="col-span-4 text-center">
              <div className="border-t border-slate-700 w-48 ml-auto pt-1">
                <span className="font-black text-[10px] text-[#081e3a] uppercase block tracking-wider">
                  AUTHORIZED SIGNATORY
                </span>
                <span className="text-[9px] text-slate-500 font-bold block uppercase">
                  {company.name || 'BLUEBOXX DA PVT. LTD.'}
                </span>
              </div>
            </div>
          </div>

          {/* BOTTOM CURVED ACCENT WAVE */}
          <div className="mt-4 -mx-8 -mb-8 h-3 bg-gradient-to-r from-[#081e3a] via-[#10305a] to-[#e69a0e] rounded-b-xl" />
        </div>
      </div>
    </Modal>
  );
}
