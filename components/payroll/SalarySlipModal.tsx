'use client';

import React, { useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Printer, User } from '@/components/ui/Icon';

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
    document.body.classList.add('is-printing-salary-slip');
    
    const handleAfterPrint = () => {
      document.body.classList.remove('is-printing-salary-slip');
      window.removeEventListener('afterprint', handleAfterPrint);
    };

    window.addEventListener('afterprint', handleAfterPrint);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('is-printing-salary-slip');
      }, 1500);
    }, 50);
  };

  // Pad table rows so earnings and deductions have equal rows
  const maxRows = Math.max(earnings.length, deductions.length, 5);
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
      maxWidth="3xl"
    >
      {/* PRECISE A4 SINGLE-PAGE PRINT STYLES */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @page {
            size: A4 portrait;
            margin: 5mm 6mm;
          }
          @media print {
            html, body {
              width: 100% !important;
              height: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              overflow: hidden !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            body.is-printing-salary-slip * {
              visibility: hidden !important;
            }
            body.is-printing-salary-slip #salary-slip-printable,
            body.is-printing-salary-slip #salary-slip-printable * {
              visibility: visible !important;
            }
            body.is-printing-salary-slip #salary-slip-printable {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 198mm !important;
              margin: 0 auto !important;
              padding: 4mm 6mm !important;
              border: 2px solid #081e3a !important;
              border-radius: 8px !important;
              box-shadow: none !important;
              background: #ffffff !important;
              z-index: 999999 !important;
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
              break-inside: avoid !important;
            }
          }
        `
      }} />

      <div className="space-y-3">
        {/* ACTION BAR (SCREEN ONLY) */}
        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Pay Period:</span>
            <span
              className="px-2.5 py-0.5 text-white font-extrabold text-xs rounded-md"
              style={{ backgroundColor: '#081e3a' }}
            >
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
              style={{ backgroundColor: '#081e3a' }}
              className="px-5 py-2 hover:opacity-90 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF (1 Page A4)</span>
            </button>
          </div>
        </div>

        {/* PRINTABLE SALARY SLIP CANVAS */}
        <div
          ref={printRef}
          id="salary-slip-printable"
          className="bg-white text-slate-900 p-5 rounded-xl border-2 border-[#081e3a] shadow-sm max-w-2xl mx-auto font-sans text-[11px] leading-tight"
          style={{
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          }}
        >
          {/* HEADER ROW: BRAND ON LEFT, SALARY SLIP BADGE ON RIGHT */}
          <div className="flex items-start justify-between gap-3 pb-1">
            <div className="flex items-center gap-2.5">
              {/* BRAND LOGO EMBLEM */}
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-xs shrink-0 border border-amber-400"
                style={{
                  backgroundColor: '#081e3a',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                }}
              >
                B
              </div>
              <div>
                <h1 className="font-black text-xl tracking-tight text-[#081e3a] uppercase leading-none">
                  {company.brand_title || 'BLUEBOXX DA'}
                </h1>
                <p className="font-black text-[11px] text-[#081e3a] tracking-wider uppercase mt-0.5">
                  {company.brand_subtitle || 'PVT. LTD.'}
                </p>
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">
                  {company.tagline || 'LEARNING TODAY, LEADING TOMORROW'}
                </p>
              </div>
            </div>

            {/* ANGLED SALARY SLIP BADGE */}
            <div className="relative shrink-0 pt-0.5">
              <div
                className="text-white px-5 py-1.5 rounded-r-md font-black text-xs tracking-wider uppercase flex items-center gap-2 relative shadow-2xs skew-x-[-12deg]"
                style={{
                  backgroundColor: '#081e3a',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                }}
              >
                <span className="skew-x-[12deg]">SALARY SLIP</span>
              </div>
              <div
                className="absolute top-0.5 -right-1.5 w-1.5 h-full rounded-r-xs skew-x-[-12deg]"
                style={{
                  backgroundColor: '#e69a0e',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                }}
              />
            </div>
          </div>

          {/* GOLD DIVIDER */}
          <div
            className="h-0.5 w-full my-1.5"
            style={{
              backgroundColor: '#e69a0e',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          />

          {/* COMPANY CONTACT DETAILS & PAY INFO BOX */}
          <div className="grid grid-cols-12 gap-3 py-1 items-center">
            {/* Contact Details */}
            <div className="col-span-7 space-y-0.5 text-[10px] text-slate-700">
              <p className="flex items-start gap-1 font-medium">
                <span className="font-bold text-[#081e3a]">📍</span>
                <span>{company.address || 'SF-02, India Bulls Mega Mall, Akota Road, near Jetalpur Bridge, Vadodara, Gujarat 390022.'}</span>
              </p>
              <p className="flex items-center gap-1 font-medium">
                <span className="font-bold text-[#081e3a]">🌐</span>
                <span className="text-[#081e3a] font-semibold">{company.website || 'https://blueboxx.in/'}</span>
              </p>
              <p className="flex items-center gap-1 font-medium">
                <span className="font-bold text-[#081e3a]">✉️</span>
                <span>{company.email || 'info.blueboxx@gmail.com'}</span>
              </p>
              <p className="flex items-center gap-1 font-medium">
                <span className="font-bold text-[#081e3a]">📞</span>
                <span>{company.phone || '9023512853 | 6352524266'}</span>
              </p>
            </div>

            {/* Right Pay Info Box */}
            <div className="col-span-5 border border-slate-300 rounded-md overflow-hidden text-[10px] bg-slate-50/70">
              <div className="flex border-b border-slate-200 p-1">
                <span className="font-extrabold text-[#081e3a] w-1/2 uppercase text-[9px]">PAY SLIP FOR MONTH OF</span>
                <span className="font-bold text-slate-800 w-1/2 text-right">{pay_period_month} {pay_period_year}</span>
              </div>
              <div className="flex border-b border-slate-200 p-1">
                <span className="font-extrabold text-[#081e3a] w-1/2 uppercase text-[9px]">PAY DATE</span>
                <span className="font-bold text-slate-800 w-1/2 text-right">{pay_date}</span>
              </div>
              <div className="flex p-1">
                <span className="font-extrabold text-[#081e3a] w-1/2 uppercase text-[9px]">PAYMENT MODE</span>
                <span className="font-bold text-slate-800 w-1/2 text-right capitalize">{payment_mode?.replace('_', ' ') || 'Bank Transfer'}</span>
              </div>
            </div>
          </div>

          {/* EMPLOYEE INFO BLOCK */}
          <div
            className="my-1.5 border border-[#081e3a] rounded-lg flex items-stretch overflow-hidden bg-white"
          >
            {/* Left User Icon Badge */}
            <div
              className="w-14 text-white flex items-center justify-center shrink-0"
              style={{
                backgroundColor: '#081e3a',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            >
              <User className="w-7 h-7 text-white" />
            </div>

            {/* 2-Column Dotted Fields */}
            <div className="flex-1 p-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
              <div className="flex items-center justify-between border-b border-dotted border-slate-300 pb-0.5">
                <span className="font-black text-[#081e3a] uppercase text-[9px] w-32">EMPLOYEE NAME :</span>
                <span className="font-bold text-slate-900 truncate">{employee.name || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-dotted border-slate-300 pb-0.5">
                <span className="font-black text-[#081e3a] uppercase text-[9px] w-32">DATE OF JOINING :</span>
                <span className="font-bold text-slate-900">{employee.joining_date || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-dotted border-slate-300 pb-0.5">
                <span className="font-black text-[#081e3a] uppercase text-[9px] w-32">EMPLOYEE ID :</span>
                <span className="font-bold text-slate-900 font-mono">{employee.employee_id || `EMP-${id}`}</span>
              </div>

              <div className="flex items-center justify-between border-b border-dotted border-slate-300 pb-0.5">
                <span className="font-black text-[#081e3a] uppercase text-[9px] w-32">PAN NUMBER :</span>
                <span className="font-bold text-slate-900 font-mono">{employee.pan_number || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-dotted border-slate-300 pb-0.5">
                <span className="font-black text-[#081e3a] uppercase text-[9px] w-32">DESIGNATION :</span>
                <span className="font-bold text-slate-900 truncate">{employee.designation || 'Staff'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-dotted border-slate-300 pb-0.5">
                <span className="font-black text-[#081e3a] uppercase text-[9px] w-32">BANK NAME :</span>
                <span className="font-bold text-slate-900">{employee.bank_name || 'HDFC Bank'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-dotted border-slate-300 pb-0.5">
                <span className="font-black text-[#081e3a] uppercase text-[9px] w-32">DEPARTMENT :</span>
                <span className="font-bold text-slate-900 truncate">{employee.department || 'General'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-dotted border-slate-300 pb-0.5">
                <span className="font-black text-[#081e3a] uppercase text-[9px] w-32">BANK A/C NO. :</span>
                <span className="font-bold text-slate-900 font-mono">{employee.bank_account_no || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* TWO-COLUMN EARNINGS VS DEDUCTIONS TABLE */}
          <div
            className="my-1.5 border border-[#081e3a] rounded-lg overflow-hidden text-[10px]"
          >
            <div
              className="grid grid-cols-2 text-white font-black text-[11px] uppercase tracking-wider divide-x divide-white"
              style={{
                backgroundColor: '#081e3a',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            >
              <div className="py-1 text-center">EARNINGS</div>
              <div className="py-1 text-center">DEDUCTIONS</div>
            </div>

            {/* Sub-header row */}
            <div
              className="grid grid-cols-12 text-[#081e3a] font-extrabold text-[9px] uppercase border-b border-slate-300 divide-x divide-slate-300"
              style={{
                backgroundColor: '#e8f1fb',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            >
              <div className="col-span-4 p-1 pl-2">PARTICULARS</div>
              <div className="col-span-2 p-1 text-right pr-2">AMOUNT (₹)</div>
              <div className="col-span-4 p-1 pl-2">PARTICULARS</div>
              <div className="col-span-2 p-1 text-right pr-2">AMOUNT (₹)</div>
            </div>

            {/* Data Rows */}
            <div className="divide-y divide-slate-200">
              {paddedEarnings.map((earn, idx) => {
                const ded = paddedDeductions[idx] || { particulars: '', amount: '' };
                return (
                  <div key={idx} className="grid grid-cols-12 divide-x divide-slate-200 text-slate-800">
                    <div className="col-span-4 p-1 pl-2 font-semibold truncate">{earn.particulars}</div>
                    <div className="col-span-2 p-1 text-right pr-2 font-mono font-medium">
                      {earn.amount !== '' && earn.amount !== undefined ? Number(earn.amount).toFixed(2) : ''}
                    </div>
                    <div className="col-span-4 p-1 pl-2 font-semibold truncate">{ded.particulars}</div>
                    <div className="col-span-2 p-1 text-right pr-2 font-mono font-medium">
                      {ded.amount !== '' && ded.amount !== undefined ? Number(ded.amount).toFixed(2) : ''}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals Row */}
            <div
              className="grid grid-cols-12 text-[#081e3a] font-black text-[10px] border-t divide-x"
              style={{
                backgroundColor: '#e8f1fb',
                borderColor: '#081e3a',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            >
              <div className="col-span-4 p-1 pl-2 uppercase">TOTAL EARNINGS (A)</div>
              <div className="col-span-2 p-1 text-right pr-2 font-mono">₹ {Number(total_earnings).toFixed(2)}</div>
              <div className="col-span-4 p-1 pl-2 uppercase">TOTAL DEDUCTIONS (B)</div>
              <div className="col-span-2 p-1 text-right pr-2 font-mono">₹ {Number(total_deductions).toFixed(2)}</div>
            </div>
          </div>

          {/* NET SALARY HIGHLIGHT BOX */}
          <div
            className="my-1.5 border border-[#081e3a] rounded-lg overflow-hidden flex items-center bg-white shadow-2xs"
          >
            {/* Left Dark Blue Badge */}
            <div
              className="text-white p-2 flex items-center gap-2.5 w-44 shrink-0"
              style={{
                backgroundColor: '#081e3a',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            >
              <div className="w-6 h-6 rounded-full bg-white text-[#081e3a] flex items-center justify-center font-black text-sm shrink-0">
                ₹
              </div>
              <div className="leading-tight">
                <span className="font-black text-[11px] block uppercase">NET SALARY</span>
                <span className="text-[9px] font-bold text-slate-300">(A − B)</span>
              </div>
            </div>

            {/* Center Big Number */}
            <div className="px-4 py-1.5 border-r border-slate-200 shrink-0">
              <span className="font-black text-xl text-[#081e3a] tracking-tight">
                ₹ {Number(net_salary).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Right Amount in Words */}
            <div className="flex-1 px-3 py-1 text-[10px]">
              <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">AMOUNT IN WORDS</span>
              <p className="font-extrabold text-slate-800 italic mt-0.5">
                {net_salary_words || 'Rupees Zero Only'}
              </p>
            </div>
          </div>

          {/* FOOTER & SEAL / SIGNATORY BLOCK */}
          <div className="pt-2 mt-2 border-t border-slate-200 grid grid-cols-12 gap-3 items-end">
            {/* Left Disclaimer */}
            <div className="col-span-5 text-[9px] text-slate-500 italic space-y-0.5">
              <p>This is a computer generated payslip and does not require any signature.</p>
              <p className="font-bold text-[#081e3a] not-italic">Thank you for your contribution!</p>
            </div>

            {/* Center Circular Stamp */}
            <div className="col-span-3 flex justify-center">
              <div
                className="w-14 h-14 rounded-full border-2 border-dashed p-1 flex flex-col items-center justify-center text-center text-[6px] font-black uppercase leading-tight transform -rotate-6"
                style={{
                  borderColor: '#10305a',
                  color: '#10305a',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                }}
              >
                <span>BLUEBOXX DA</span>
                <span className="text-[7px] my-0.5">★</span>
                <span>VADODARA</span>
                <span>GUJARAT</span>
              </div>
            </div>

            {/* Right Authorized Signatory */}
            <div className="col-span-4 text-center">
              <div className="border-t border-slate-700 w-36 ml-auto pt-0.5">
                <span className="font-black text-[9px] text-[#081e3a] uppercase block tracking-wider">
                  AUTHORIZED SIGNATORY
                </span>
                <span className="text-[8px] text-slate-500 font-bold block uppercase">
                  {company.name || 'BLUEBOXX DA PVT. LTD.'}
                </span>
              </div>
            </div>
          </div>

          {/* BOTTOM ACCENT BAR */}
          <div
            className="mt-2 -mx-5 -mb-5 h-2 rounded-b-lg"
            style={{
              background: 'linear-gradient(to right, #081e3a, #10305a, #e69a0e)',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          />
        </div>
      </div>
    </Modal>
  );
}
