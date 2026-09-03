/**
 * PDF Download & Print Utilities for Invoices
 */

export function printInvoiceDocument(elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  window.print();
}

export function downloadInvoiceAsPDF(invoice: any, company: any) {
  const invoiceHTML = generatePrintableInvoiceHTML(invoice, company);
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups for downloading and printing invoices.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(invoiceHTML);
  printWindow.document.close();

  // Wait for images to load before printing
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  };
}

export function formatCurrency(amount: number | string | undefined | null, currency = 'INR'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  if (isNaN(num)) return '₹0.00';
  
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹';
  return `${symbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generatePrintableInvoiceHTML(invoice: any, company: any): string {
  const inv = invoice || {};
  const comp = company || {};
  const items = inv.items || [];
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const logoUrl = comp.logo || '/images/logoblue.png';
  const fullLogoUrl = logoUrl.startsWith('http') ? logoUrl : `${origin}${logoUrl}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title> </title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    html, body {
      background: #ffffff;
      color: #334155;
      font-size: 13px;
      line-height: 1.5;
      margin: 0;
      padding: 0;
    }
    .invoice-container {
      width: 100%;
      max-width: 100%;
      padding: 22mm 22mm 18mm 22mm;
      margin: 0 auto;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .header-divider {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 0 0 28px 0;
      width: 100%;
    }
    .header-table td {
      vertical-align: top;
    }
    .company-logo {
      height: 54px;
      max-width: 250px;
      object-fit: contain;
      display: block;
    }
    .invoice-badge {
      background-color: #269784 !important;
      color: #ffffff !important;
      font-weight: 800;
      font-size: 15px;
      padding: 6px 18px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      display: inline-block;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .bill-date {
      font-size: 12px;
      color: #64748b;
      margin-top: 6px;
      font-weight: 500;
    }
    .two-col {
      width: 100%;
      display: table;
      margin-bottom: 36px;
    }
    .col {
      display: table-cell;
      width: 50%;
      vertical-align: top;
    }
    .company-title, .bill-to-title {
      font-weight: 700;
      font-size: 13px;
      color: #0f172a;
      margin-bottom: 3px;
    }
    .client-name {
      font-weight: 600;
      color: #0f172a;
      font-size: 13px;
    }
    .details-text {
      color: #475569;
      font-size: 12px;
      line-height: 1.55;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 24px;
    }
    table.items-table th {
      background-color: #269784 !important;
      color: #ffffff !important;
      font-size: 12px;
      font-weight: 700;
      padding: 9px 14px;
      text-align: left;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    table.items-table th.text-center, table.items-table td.text-center {
      text-align: center;
    }
    table.items-table th.text-right, table.items-table td.text-right {
      text-align: right;
    }
    table.items-table td {
      padding: 12px 14px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 12px;
    }
    .item-name {
      font-weight: 600;
      color: #0f172a;
    }
    .item-desc {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .totals-container {
      width: 100%;
      display: table;
      margin-top: 10px;
    }
    .totals-wrapper {
      float: right;
      width: 320px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 12px;
      color: #334155;
    }
    .total-label {
      font-weight: 500;
      text-align: right;
      width: 50%;
      padding-right: 15px;
    }
    .total-val {
      text-align: right;
      width: 50%;
    }
    .balance-due-box {
      background-color: #269784 !important;
      color: #ffffff !important;
      padding: 8px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 800;
      font-size: 13px;
      margin-top: 4px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @media print {
      html, body {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .invoice-container {
        padding: 22mm 22mm 18mm 22mm !important;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <table class="header-table">
      <tr>
        <td>
          <img src="${fullLogoUrl}" alt="BLUEBOXX DA" class="company-logo" />
        </td>
        <td style="text-align: right;">
          <div class="invoice-badge">PERFORMA INVOICE</div>
          <div class="bill-date">Bill date: ${inv.invoice_date ? new Date(inv.invoice_date).toISOString().slice(0, 10) : ''}</div>
        </td>
      </tr>
    </table>

    <hr class="header-divider" />

    <div class="two-col">
      <div class="col">
        <div class="company-title">Blueboxx DA</div>
        <div class="details-text">
          02, India Bulls Mall, Jetalpur Road, Vadodara<br>
          Phone: 9023512853<br>
          Website: http://www.blueboxx.in/
        </div>
      </div>

      <div class="col">
        <div class="bill-to-title">Bill To</div>
        <div class="client-name">${inv.client_name || inv.client_company_name || 'Shah Aangi Tarakkumar'}</div>
        <div class="details-text">
          ${inv.client_company_name && inv.client_name ? `${inv.client_company_name}<br>` : ''}
          ${inv.client_address ? `${inv.client_address}<br>` : ''}
          ${inv.client_city ? `${inv.client_city}` : ''}
          ${inv.client_state ? `, ${inv.client_state}` : ''}
          ${inv.client_postal_code ? `<br>${inv.client_postal_code}` : ''}
          ${inv.client_country ? `<br>${inv.client_country}` : ''}
          ${inv.client_phone ? `<br>Phone: ${inv.client_phone}` : ''}
          ${inv.client_email ? `<br>Email: ${inv.client_email}` : ''}
        </div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 50%;">Item</th>
          <th class="text-center" style="width: 15%;">Quantity</th>
          <th class="text-right" style="width: 17%;">Rate</th>
          <th class="text-right" style="width: 18%;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((it: any) => `
          <tr>
            <td>
              <div class="item-name">${it.item_name}</div>
              ${it.description ? `<div class="item-desc">${it.description}</div>` : ''}
            </td>
            <td class="text-center">${it.quantity}</td>
            <td class="text-right">${formatCurrency(it.rate, inv.currency)}</td>
            <td class="text-right">${formatCurrency(it.total, inv.currency)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals-container">
      <div class="totals-wrapper">
        <div class="total-row">
          <span class="total-label">Sub Total</span>
          <span class="total-val">${formatCurrency(inv.subtotal, inv.currency)}</span>
        </div>

        ${inv.discount_amount > 0 ? `
        <div class="total-row">
          <span class="total-label">Discount ${inv.discount_type === 'percentage' ? `(${inv.discount_value}%)` : ''}</span>
          <span class="total-val">-${formatCurrency(inv.discount_amount, inv.currency)}</span>
        </div>
        ` : ''}

        ${inv.tax_amount > 0 ? `
        <div class="total-row">
          <span class="total-label">Tax (${inv.tax_percentage}%)</span>
          <span class="total-val">+${formatCurrency(inv.tax_amount, inv.currency)}</span>
        </div>
        ` : ''}

        <div class="total-row">
          <span class="total-label">Paid</span>
          <span class="total-val">${formatCurrency(inv.paid_amount, inv.currency)}</span>
        </div>

        <div class="balance-due-box">
          <span>Balance Due</span>
          <span>${formatCurrency(inv.balance_due, inv.currency)}</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
