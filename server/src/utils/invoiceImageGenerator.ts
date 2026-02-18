import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import type { InvoicePDFData } from './pdfGenerator.js';

/** Generate invoice as PNG image using HTML + Puppeteer */
export async function generateInvoiceImage(invoice: InvoicePDFData): Promise<Buffer> {
  const currency = '৳';
  const totalPaid = invoice.totalPaid ?? 0;
  const dueAmount = invoice.dueAmount ?? Number(invoice.totalAmount);
  const client = invoice.client;
  const ci = client?.contactInfo && typeof client.contactInfo === 'object' ? client.contactInfo : null;
  const statusColor = invoice.status === 'Paid' ? '#059669' : invoice.status === 'Overdue' ? '#dc2626' : '#d97706';

  const itemsHtml = (invoice.items || [])
    .map(
      (item, idx) => `
    <tr class="${idx % 2 === 1 ? 'row-alt' : ''}">
      <td>${escapeHtml(item.description.substring(0, 50))}</td>
      <td class="text-right">${Number(item.quantity).toLocaleString()}</td>
      <td class="text-right">${currency} ${Number(item.unitPrice).toLocaleString()}</td>
      <td class="text-right">${currency} ${Number(item.total).toLocaleString()}</td>
    </tr>
  `
    )
    .join('');

  // Resolve logo as base64 data URL (Puppeteer setContent cannot load file:// URLs)
  let logoDataUrl: string | null = null;
  if (invoice.companyLogoPath) {
    const logoPath = path.join(process.cwd(), invoice.companyLogoPath.replace(/^\//, ''));
    if (fs.existsSync(logoPath)) {
      try {
        const ext = path.extname(logoPath).toLowerCase();
        const mimeMap: Record<string, string> = {
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
          '.svg': 'image/svg+xml',
        };
        const mime = mimeMap[ext] || 'image/png';
        const buf = fs.readFileSync(logoPath);
        logoDataUrl = `data:${mime};base64,${buf.toString('base64')}`;
      } catch (_) {
        // Skip logo on read error
      }
    }
  }

  const termsHtml = `
  <div class="label" style="margin-top: 16px;">Terms & Conditions</div>
  <div class="meta" style="margin-top: 6px; font-size: 9px; line-height: 1.4;">
    • Payment is due within the specified due date. Late payments may incur additional charges.<br>
    • All amounts are in Bangladeshi Taka (BDT).<br>
    • This invoice is subject to our standard terms of service.<br>
    • Please retain this document for your records.
  </div>
  `;

  const payments = invoice.payments || [];
  const paymentsHtml =
    payments.length > 0
      ? `
  <div class="label" style="margin-top: 16px;">Payment History</div>
  <table style="margin-top: 6px;">
    <thead>
      <tr>
        <th>Method</th>
        <th class="text-right">Amount</th>
        <th>Transaction ID</th>
        <th>Date</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${payments
        .map(
          (p: any) => `
        <tr class="row-alt">
          <td>${escapeHtml((p.paymentMethod || '-').substring(0, 15))}</td>
          <td class="text-right">${currency} ${Number(p.amount).toLocaleString()}</td>
          <td>${escapeHtml((p.transactionId || '-').substring(0, 18))}</td>
          <td>${new Date(p.createdAt).toLocaleDateString()}</td>
          <td>${escapeHtml(p.status || '-')}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>
  `
      : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; color: #1e293b; width: 595px; }
    .bar { height: 6px; background: #4f46e5; margin: -32px -32px 24px -32px; }
    h1 { font-size: 28px; color: #4f46e5; margin-bottom: 4px; }
    .inv-num { font-size: 14px; color: #64748b; margin-bottom: 24px; }
    .two-col { display: flex; gap: 40px; margin-bottom: 24px; }
    .col { flex: 1; }
    .label { font-weight: 600; font-size: 11px; margin-bottom: 8px; color: #1e293b; }
    .meta { font-size: 10px; color: #64748b; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 9px; font-weight: 600; color: #fff; background: ${statusColor}; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 8px; }
    th { background: #f8fafc; padding: 8px; text-align: left; font-weight: 600; border: 1px solid #e2e8f0; }
    th.text-right { text-align: right; }
    td { padding: 8px; border: 1px solid #e2e8f0; }
    td.text-right { text-align: right; }
    .row-alt { background: #f8fafc; }
    .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 10px; }
    .summary-row.due { background: #4f46e5; color: #fff; font-weight: 600; padding: 10px; margin-top: 4px; font-size: 12px; }
    .total-label { font-size: 11px; }
    .total-amt { font-size: 12px; }
    .notes { margin-top: 20px; font-size: 9px; color: #64748b; }
    .currency-note { font-size: 8px; color: #94a3b8; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="bar"></div>
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
    <div>
      <h1>INVOICE</h1>
      <p class="inv-num">#${escapeHtml(invoice.invoiceNumber)}</p>
    </div>
    ${logoDataUrl ? `<img src="${logoDataUrl}" alt="Logo" style="height: 36px; max-width: 90px; object-fit: contain;">` : ''}
  </div>

  <div class="two-col">
    <div class="col">
      <div class="label">Bill To</div>
      <div class="meta">${escapeHtml(client?.name || 'N/A')}</div>
      ${ci?.email ? `<div class="meta">${escapeHtml(ci.email)}</div>` : ''}
      ${ci?.phone ? `<div class="meta">${escapeHtml(ci.phone)}</div>` : ''}
    </div>
    <div class="col">
      <div class="label">Invoice Details</div>
      <div class="meta">Issue: ${new Date(invoice.issueDate).toLocaleDateString()}</div>
      <div class="meta">Due: ${new Date(invoice.dueDate).toLocaleDateString()}</div>
      <div style="margin-top: 8px;"><span class="status">${escapeHtml(invoice.status)}</span></div>
      ${invoice.project?.title ? `<div class="meta" style="margin-top: 8px;">Project: ${escapeHtml(invoice.project.title)}</div>` : ''}
    </div>
  </div>

  <div class="label">Items</div>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Unit Price</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <div class="summary-row">
    <span class="total-label">Total Amount</span>
    <span class="total-amt">${currency} ${Number(invoice.totalAmount).toLocaleString()}</span>
  </div>
  <div class="summary-row">
    <span class="total-label">Total Paid</span>
    <span class="total-amt">${currency} ${totalPaid.toLocaleString()}</span>
  </div>
  <div class="summary-row due">
    <span class="total-label">Due Amount (Taka / BDT)</span>
    <span class="total-amt">${currency} ${dueAmount.toLocaleString()}</span>
  </div>

  ${paymentsHtml}

  ${termsHtml}

  ${invoice.notes ? `<div class="notes" style="margin-top: 16px;"><strong>Notes:</strong> ${escapeHtml(invoice.notes.substring(0, 300))}</div>` : ''}
  <div class="currency-note">Generated ${new Date().toLocaleString()} • All amounts in Bangladeshi Taka (৳)</div>
</body>
</html>
  `;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 595, height: 842, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const buffer = await page.screenshot({ type: 'png', fullPage: true });
    return Buffer.from(buffer as ArrayBuffer);
  } finally {
    await browser.close();
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
