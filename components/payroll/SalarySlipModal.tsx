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

  // Pad table rows so earnings and deductions have equal balanced rows
  const maxRows = Math.max(earnings.length, deductions.length, 6);
  const paddedEarnings = [...earnings];
  const paddedDeductions = [...deductions];
  while (paddedEarnings.length < maxRows) {
    paddedEarnings.push({ particulars: '', amount: '' });
  }
  while (paddedDeductions.length < maxRows) {
    paddedDeductions.push({ particulars: '', amount: '' });
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=1100');
    if (!printWindow) {
      alert('Please allow popups to print/save the salary slip.');
      return;
    }

    const earningsRowsHtml = paddedEarnings.map((earn, idx) => {
      const ded = paddedDeductions[idx] || { particulars: '', amount: '' };
      return `
        <tr style="border-bottom: 1px solid #cbd5e1; font-size: 11px;">
          <td style="padding: 7px 12px; font-weight: 600; color: #1e293b; border-right: 1px solid #cbd5e1; width: 33%;">${earn.particulars || ''}</td>
          <td style="padding: 7px 12px; font-family: monospace; text-align: right; border-right: 2px solid #081e3a; width: 17%;">${earn.amount !== '' && earn.amount !== undefined ? Number(earn.amount).toFixed(2) : ''}</td>
          <td style="padding: 7px 12px; font-weight: 600; color: #1e293b; border-right: 1px solid #cbd5e1; width: 33%;">${ded.particulars || ''}</td>
          <td style="padding: 7px 12px; font-family: monospace; text-align: right; width: 17%;">${ded.amount !== '' && ded.amount !== undefined ? Number(ded.amount).toFixed(2) : ''}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>${company.name || 'BLUEBOXX DA PVT. LTD.'} - Salary Slip - ${employee.name || 'Staff'}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #081e3a;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
            }
            .page-sheet {
              width: 100%;
              max-width: 190mm;
              min-height: 270mm;
              margin: 0 auto;
              padding: 24px 28px;
              border: 2.5px solid #081e3a;
              border-radius: 12px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              background: #ffffff;
            }
            .header-flex {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding-bottom: 8px;
            }
            .logo-box {
              width: 52px;
              height: 52px;
              background: #081e3a;
              border: 2px solid #e69a0e;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-size: 26px;
              font-weight: 900;
              margin-right: 14px;
            }
            .brand-title {
              font-size: 24px;
              font-weight: 900;
              color: #081e3a;
              line-height: 1;
              text-transform: uppercase;
              letter-spacing: -0.5px;
            }
            .brand-subtitle {
              font-size: 13px;
              font-weight: 900;
              color: #081e3a;
              text-transform: uppercase;
              margin-top: 3px;
              letter-spacing: 1px;
            }
            .brand-tagline {
              font-size: 9.5px;
              font-weight: 700;
              color: #475569;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin-top: 3px;
            }
            .slip-badge {
              background: #081e3a;
              color: #ffffff;
              padding: 10px 28px;
              font-size: 15px;
              font-weight: 900;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              transform: skewX(-12deg);
              position: relative;
              box-shadow: 2px 2px 0px #e69a0e;
            }
            .gold-divider {
              height: 2.5px;
              background: #e69a0e;
              width: 100%;
              margin: 10px 0 14px 0;
            }
            .contact-grid {
              display: grid;
              grid-template-columns: 1.2fr 0.8fr;
              gap: 16px;
              align-items: center;
              margin-bottom: 14px;
            }
            .contact-details {
              font-size: 11px;
              color: #334155;
              line-height: 1.5;
            }
            .contact-item {
              margin-bottom: 3px;
            }
            .pay-info-box {
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              background: #f8fafc;
              font-size: 11px;
              overflow: hidden;
            }
            .pay-info-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 10px;
              border-bottom: 1px solid #e2e8f0;
            }
            .pay-info-row:last-child {
              border-bottom: none;
            }
            .emp-card {
              border: 1.5px solid #081e3a;
              border-radius: 10px;
              display: flex;
              align-items: stretch;
              overflow: hidden;
              margin-bottom: 14px;
            }
            .emp-icon-col {
              width: 70px;
              background: #081e3a;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-size: 28px;
            }
            .emp-details-grid {
              flex: 1;
              padding: 10px 16px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              column-gap: 20px;
              row-gap: 6px;
              font-size: 11px;
            }
            .field-row {
              display: flex;
              justify-content: space-between;
              border-bottom: 1px dotted #cbd5e1;
              padding-bottom: 2px;
            }
            .field-label {
              font-weight: 900;
              color: #081e3a;
              text-transform: uppercase;
              font-size: 10px;
            }
            .field-value {
              font-weight: 700;
              color: #0f172a;
            }
            .table-container {
              border: 1.5px solid #081e3a;
              border-radius: 10px;
              overflow: hidden;
              margin-bottom: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            .tbl-main-head {
              background: #081e3a;
              color: #ffffff;
              font-size: 13px;
              font-weight: 900;
              letter-spacing: 1px;
              text-transform: uppercase;
              text-align: center;
              padding: 8px;
            }
            .tbl-sub-head {
              background: #e8f1fb;
              color: #081e3a;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              padding: 6px 12px;
              border-bottom: 1px solid #cbd5e1;
            }
            .tbl-total-row {
              background: #e8f1fb;
              color: #081e3a;
              font-size: 11.5px;
              font-weight: 900;
              border-top: 1.5px solid #081e3a;
            }
            .net-box {
              border: 1.5px solid #081e3a;
              border-radius: 10px;
              display: flex;
              align-items: center;
              overflow: hidden;
              margin-bottom: 14px;
              background: #ffffff;
            }
            .net-badge {
              background: #081e3a;
              color: #ffffff;
              padding: 12px 18px;
              display: flex;
              align-items: center;
              gap: 10px;
              width: 190px;
            }
            .net-badge-icon {
              width: 28px;
              height: 28px;
              background: #ffffff;
              color: #081e3a;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              font-weight: 900;
            }
            .net-amount {
              padding: 10px 20px;
              font-size: 24px;
              font-weight: 900;
              color: #081e3a;
              border-right: 1px solid #e2e8f0;
            }
            .net-words {
              flex: 1;
              padding: 10px 18px;
              font-size: 11.5px;
            }
            .footer-grid {
              display: grid;
              grid-template-columns: 1fr 120px 1fr;
              gap: 16px;
              align-items: flex-end;
              padding-top: 14px;
              border-top: 1px solid #e2e8f0;
            }
            .stamp-circle {
              width: 76px;
              height: 76px;
              border: 2px dashed #081e3a;
              border-radius: 50%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              font-size: 7.5px;
              font-weight: 900;
              color: #081e3a;
              text-transform: uppercase;
              transform: rotate(-6deg);
              margin: 0 auto;
            }
            .signatory-box {
              text-align: center;
            }
            .signatory-line {
              border-top: 1.5px solid #081e3a;
              width: 170px;
              margin-left: auto;
              padding-top: 4px;
            }
            .bottom-accent {
              height: 8px;
              background: linear-gradient(to right, #081e3a, #10305a, #e69a0e);
              border-radius: 0 0 8px 8px;
              margin-top: 12px;
            }
          </style>
        </head>
        <body>
          <div class="page-sheet">
            <div>
              <!-- HEADER -->
              <div class="header-flex">
                <div style="display: flex; align-items: center;">
                  <div class="logo-box">B</div>
                  <div>
                    <div class="brand-title">${company.brand_title || 'BLUEBOXX DA'}</div>
                    <div class="brand-subtitle">${company.brand_subtitle || 'PVT. LTD.'}</div>
                    <div class="brand-tagline">${company.tagline || 'LEARNING TODAY, LEADING TOMORROW'}</div>
                  </div>
                </div>

                <div>
                  <div class="slip-badge">
                    <span style="transform: skewX(12deg); display: inline-block;">SALARY SLIP</span>
                  </div>
                </div>
              </div>

              <div class="gold-divider"></div>

              <!-- CONTACT & INFO -->
              <div class="contact-grid">
                <div class="contact-details">
                  <div class="contact-item"><strong>📍</strong> ${company.address || 'SF-02, India Bulls Mega Mall, Akota Road, near Jetalpur Bridge, Vadodara, Gujarat 390022.'}</div>
                  <div class="contact-item"><strong>🌐</strong> <a href="${company.website || 'https://blueboxx.in/'}" style="color: #081e3a; font-weight: 700;">${company.website || 'https://blueboxx.in/'}</a></div>
                  <div class="contact-item"><strong>✉️</strong> ${company.email || 'info.blueboxx@gmail.com'}</div>
                  <div class="contact-item"><strong>📞</strong> ${company.phone || '9023512853 | 6352524266'}</div>
                </div>

                <div class="pay-info-box">
                  <div class="pay-info-row">
                    <span style="font-weight: 800; text-transform: uppercase; font-size: 9.5px; color: #081e3a;">Pay Slip For Month Of</span>
                    <span style="font-weight: 800; color: #0f172a;">${pay_period_month} ${pay_period_year}</span>
                  </div>
                  <div class="pay-info-row">
                    <span style="font-weight: 800; text-transform: uppercase; font-size: 9.5px; color: #081e3a;">Pay Date</span>
                    <span style="font-weight: 800; color: #0f172a;">${pay_date}</span>
                  </div>
                  <div class="pay-info-row">
                    <span style="font-weight: 800; text-transform: uppercase; font-size: 9.5px; color: #081e3a;">Payment Mode</span>
                    <span style="font-weight: 800; color: #0f172a; text-transform: capitalize;">${payment_mode?.replace('_', ' ') || 'Bank Transfer'}</span>
                  </div>
                </div>
              </div>

              <!-- EMPLOYEE DETAILS -->
              <div class="emp-card">
                <div class="emp-icon-col">👤</div>
                <div class="emp-details-grid">
                  <div class="field-row">
                    <span class="field-label">Employee Name :</span>
                    <span class="field-value">${employee.name || 'N/A'}</span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Date of Joining :</span>
                    <span class="field-value">${employee.joining_date || 'N/A'}</span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Employee ID :</span>
                    <span class="field-value" style="font-family: monospace;">${employee.employee_id || `EMP-${id}`}</span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">PAN Number :</span>
                    <span class="field-value" style="font-family: monospace;">${employee.pan_number || 'N/A'}</span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Designation :</span>
                    <span class="field-value">${employee.designation || 'Staff'}</span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Bank Name :</span>
                    <span class="field-value">${employee.bank_name || 'HDFC Bank'}</span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Department :</span>
                    <span class="field-value">${employee.department || 'General'}</span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Bank A/C No. :</span>
                    <span class="field-value" style="font-family: monospace;">${employee.bank_account_no || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <!-- TABLE -->
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th colspan="2" class="tbl-main-head" style="border-right: 2px solid #ffffff; width: 50%;">EARNINGS</th>
                      <th colspan="2" class="tbl-main-head" style="width: 50%;">DEDUCTIONS</th>
                    </tr>
                    <tr>
                      <th class="tbl-sub-head" style="width: 33%; border-right: 1px solid #cbd5e1;">Particulars</th>
                      <th class="tbl-sub-head" style="text-align: right; width: 17%; border-right: 2px solid #081e3a;">Amount (₹)</th>
                      <th class="tbl-sub-head" style="width: 33%; border-right: 1px solid #cbd5e1;">Particulars</th>
                      <th class="tbl-sub-head" style="text-align: right; width: 17%;">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${earningsRowsHtml}
                    <tr class="tbl-total-row">
                      <td style="padding: 9px 12px; text-transform: uppercase; border-right: 1px solid #cbd5e1;">TOTAL EARNINGS (A)</td>
                      <td style="padding: 9px 12px; font-family: monospace; text-align: right; border-right: 2px solid #081e3a;">₹ ${Number(total_earnings).toFixed(2)}</td>
                      <td style="padding: 9px 12px; text-transform: uppercase; border-right: 1px solid #cbd5e1;">TOTAL DEDUCTIONS (B)</td>
                      <td style="padding: 9px 12px; font-family: monospace; text-align: right;">₹ ${Number(total_deductions).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- NET SALARY -->
              <div class="net-box">
                <div class="net-badge">
                  <div class="net-badge-icon">₹</div>
                  <div>
                    <div style="font-size: 13px; font-weight: 900; letter-spacing: 0.5px;">NET SALARY</div>
                    <div style="font-size: 10px; color: #cbd5e1; font-weight: 700;">(A − B)</div>
                  </div>
                </div>
                <div class="net-amount">
                  ₹ ${Number(net_salary).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div class="net-words">
                  <div style="font-size: 9px; font-weight: 900; text-transform: uppercase; color: #64748b; letter-spacing: 1px;">AMOUNT IN WORDS</div>
                  <div style="font-weight: 800; color: #0f172a; font-style: italic; margin-top: 2px;">${net_salary_words || 'Rupees Zero Only'}</div>
                </div>
              </div>
            </div>

            <!-- FOOTER -->
            <div>
              <div class="footer-grid">
                <div style="font-size: 10.5px; color: #64748b; font-style: italic; line-height: 1.4;">
                  <div>This is a computer generated payslip and does not require any signature.</div>
                  <div style="font-weight: 800; color: #081e3a; font-style: normal; margin-top: 3px;">Thank you for your valuable contribution!</div>
                </div>

                <div>
                  <div class="stamp-circle">
                    <span>BLUEBOXX DA</span>
                    <span style="font-size: 9px; margin: 1px 0;">★</span>
                    <span>VADODARA</span>
                    <span>GUJARAT</span>
                  </div>
                </div>

                <div class="signatory-box">
                  <div class="signatory-line">
                    <div style="font-size: 10px; font-weight: 900; color: #081e3a; text-transform: uppercase; letter-spacing: 1px;">AUTHORIZED SIGNATORY</div>
                    <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 2px;">${company.name || 'BLUEBOXX DA PVT. LTD.'}</div>
                  </div>
                </div>
              </div>

              <div class="bottom-accent"></div>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 200);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Salary Slip #${id} — ${employee.name} (${pay_period_month} ${pay_period_year})`}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* ACTION BAR */}
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
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
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>

        {/* ON-SCREEN PREVIEW CONTAINER */}
        <div
          ref={printRef}
          id="salary-slip-printable"
          className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border-2 border-[#081e3a] shadow-sm max-w-3xl mx-auto font-sans text-xs"
        >
          {/* HEADER ROW */}
          <div className="flex items-start justify-between gap-4 pb-2">
            <div className="flex items-center gap-3">
              <div className="w-13 h-13 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-sm shrink-0 border-2 border-amber-400 bg-[#081e3a]">
                B
              </div>
              <div>
                <h1 className="font-black text-2xl tracking-tight text-[#081e3a] uppercase leading-none">
                  {company.brand_title || 'BLUEBOXX DA'}
                </h1>
                <p className="font-black text-xs text-[#081e3a] tracking-wider uppercase mt-1">
                  {company.brand_subtitle || 'PVT. LTD.'}
                </p>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">
                  {company.tagline || 'LEARNING TODAY, LEADING TOMORROW'}
                </p>
              </div>
            </div>

            <div className="relative shrink-0 pt-1">
              <div className="bg-[#081e3a] text-white px-7 py-2 rounded-r-lg font-black text-sm tracking-wider uppercase flex items-center gap-2 relative shadow-2xs skew-x-[-12deg]">
                <span className="skew-x-[12deg]">SALARY SLIP</span>
              </div>
              <div className="absolute top-1 -right-2 w-2 h-full bg-[#e69a0e] rounded-r-xs skew-x-[-12deg]" />
            </div>
          </div>

          <div className="h-0.5 w-full my-2 bg-[#e69a0e]" />

          {/* CONTACT & PAY INFO */}
          <div className="grid grid-cols-12 gap-4 py-2 items-center">
            <div className="col-span-7 space-y-1 text-[11px] text-slate-700">
              <p className="flex items-center gap-2 font-medium">
                <span className="font-bold text-[#081e3a]">📍</span>
                <span>{company.address || 'SF-02, India Bulls Mega Mall, Akota Road, near Jetalpur Bridge, Vadodara, Gujarat 390022.'}</span>
              </p>
              <p className="flex items-center gap-2 font-medium">
                <span className="font-bold text-[#081e3a]">🌐</span>
                <span className="text-[#081e3a] font-semibold">{company.website || 'https://blueboxx.in/'}</span>
              </p>
              <p className="flex items-center gap-2 font-medium">
                <span className="font-bold text-[#081e3a]">✉️</span>
                <span>{company.email || 'info.blueboxx@gmail.com'}</span>
              </p>
              <p className="flex items-center gap-2 font-medium">
                <span className="font-bold text-[#081e3a]">📞</span>
                <span>{company.phone || '9023512853 | 6352524266'}</span>
              </p>
            </div>

            <div className="col-span-5 border border-slate-300 rounded-lg overflow-hidden text-[11px] bg-slate-50/60">
              <div className="flex border-b border-slate-200 p-1.5">
                <span className="font-extrabold text-[#081e3a] w-1/2 uppercase text-[10px]">PAY SLIP FOR MONTH OF</span>
                <span className="font-bold text-slate-800 w-1/2 text-right">{pay_period_month} {pay_period_year}</span>
              </div>
              <div className="flex border-b border-slate-200 p-1.5">
                <span className="font-extrabold text-[#081e3a] w-1/2 uppercase text-[10px]">PAY DATE</span>
                <span className="font-bold text-slate-800 w-1/2 text-right">{pay_date}</span>
              </div>
              <div className="flex p-1.5">
                <span className="font-extrabold text-[#081e3a] w-1/2 uppercase text-[10px]">PAYMENT MODE</span>
                <span className="font-bold text-slate-800 w-1/2 text-right capitalize">{payment_mode?.replace('_', ' ') || 'Bank Transfer'}</span>
              </div>
            </div>
          </div>

          {/* EMPLOYEE INFO */}
          <div className="my-2.5 border-2 border-[#081e3a] rounded-xl flex items-stretch overflow-hidden bg-white">
            <div className="w-18 bg-[#081e3a] text-white flex items-center justify-center shrink-0">
              <User className="w-9 h-9 text-white" />
            </div>

            <div className="flex-1 p-2.5 grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px]">
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

          {/* TABLE */}
          <div className="my-2.5 border-2 border-[#081e3a] rounded-xl overflow-hidden text-[11px]">
            <div className="grid grid-cols-2 text-white font-black text-xs uppercase tracking-wider divide-x-2 divide-white bg-[#081e3a]">
              <div className="py-1.5 text-center">EARNINGS</div>
              <div className="py-1.5 text-center">DEDUCTIONS</div>
            </div>

            <div className="grid grid-cols-12 text-[#081e3a] font-extrabold text-[10px] uppercase border-b border-slate-300 divide-x divide-slate-300 bg-[#e8f1fb]">
              <div className="col-span-4 p-1.5 pl-3">PARTICULARS</div>
              <div className="col-span-2 p-1.5 text-right pr-3">AMOUNT (₹)</div>
              <div className="col-span-4 p-1.5 pl-3">PARTICULARS</div>
              <div className="col-span-2 p-1.5 text-right pr-3">AMOUNT (₹)</div>
            </div>

            <div className="divide-y divide-slate-200">
              {paddedEarnings.map((earn, idx) => {
                const ded = paddedDeductions[idx] || { particulars: '', amount: '' };
                return (
                  <div key={idx} className="grid grid-cols-12 divide-x divide-slate-200 text-slate-800">
                    <div className="col-span-4 p-1.5 pl-3 font-semibold truncate">{earn.particulars}</div>
                    <div className="col-span-2 p-1.5 text-right pr-3 font-mono font-medium">
                      {earn.amount !== '' && earn.amount !== undefined ? Number(earn.amount).toFixed(2) : ''}
                    </div>
                    <div className="col-span-4 p-1.5 pl-3 font-semibold truncate">{ded.particulars}</div>
                    <div className="col-span-2 p-1.5 text-right pr-3 font-mono font-medium">
                      {ded.amount !== '' && ded.amount !== undefined ? Number(ded.amount).toFixed(2) : ''}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-12 text-[#081e3a] font-black text-[11px] border-t-2 border-[#081e3a] divide-x-2 divide-[#081e3a] bg-[#e8f1fb]">
              <div className="col-span-4 p-1.5 pl-3 uppercase">TOTAL EARNINGS (A)</div>
              <div className="col-span-2 p-1.5 text-right pr-3 font-mono">₹ {Number(total_earnings).toFixed(2)}</div>
              <div className="col-span-4 p-1.5 pl-3 uppercase">TOTAL DEDUCTIONS (B)</div>
              <div className="col-span-2 p-1.5 text-right pr-3 font-mono">₹ {Number(total_deductions).toFixed(2)}</div>
            </div>
          </div>

          {/* NET SALARY */}
          <div className="my-3 border-2 border-[#081e3a] rounded-xl overflow-hidden flex items-center bg-white shadow-2xs">
            <div className="bg-[#081e3a] text-white p-3 flex items-center gap-3 w-52 shrink-0">
              <div className="w-8 h-8 rounded-full bg-white text-[#081e3a] flex items-center justify-center font-black text-base shrink-0">
                ₹
              </div>
              <div className="leading-tight">
                <span className="font-black text-xs block uppercase">NET SALARY</span>
                <span className="text-[10px] font-bold text-slate-300">(A − B)</span>
              </div>
            </div>

            <div className="px-5 py-2 border-r border-slate-200 shrink-0">
              <span className="font-black text-2xl text-[#081e3a] tracking-tight">
                ₹ {Number(net_salary).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex-1 px-4 py-2 text-[11px]">
              <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">AMOUNT IN WORDS</span>
              <p className="font-extrabold text-slate-800 italic mt-0.5">
                {net_salary_words || 'Rupees Zero Only'}
              </p>
            </div>
          </div>

          {/* FOOTER */}
          <div className="pt-4 mt-4 border-t border-slate-200 grid grid-cols-12 gap-4 items-end">
            <div className="col-span-5 text-[10px] text-slate-500 italic space-y-1">
              <p>This is a computer generated payslip and does not require any signature.</p>
              <p className="font-bold text-[#081e3a] not-italic">Thank you for your contribution!</p>
            </div>

            <div className="col-span-3 flex justify-center">
              <div className="w-18 h-18 rounded-full border-2 border-dashed border-[#10305a] p-1 flex flex-col items-center justify-center text-center text-[7px] font-black text-[#10305a] uppercase leading-tight transform -rotate-6">
                <span>BLUEBOXX DA</span>
                <span className="text-[8px] my-0.5">★</span>
                <span>VADODARA</span>
                <span>GUJARAT</span>
              </div>
            </div>

            <div className="col-span-4 text-center">
              <div className="border-t border-slate-700 w-44 ml-auto pt-1">
                <span className="font-black text-[10px] text-[#081e3a] uppercase block tracking-wider">
                  AUTHORIZED SIGNATORY
                </span>
                <span className="text-[9px] text-slate-500 font-bold block uppercase">
                  {company.name || 'BLUEBOXX DA PVT. LTD.'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 -mx-8 -mb-8 h-3 rounded-b-xl bg-gradient-to-r from-[#081e3a] via-[#10305a] to-[#e69a0e]" />
        </div>
      </div>
    </Modal>
  );
}
