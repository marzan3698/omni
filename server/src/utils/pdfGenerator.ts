import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface ProjectData {
  id: number;
  title: string;
  description?: string | null;
  budget: number;
  time: string;
  createdAt: Date;
  clientId: string;
}

/**
 * Generate PDF document for project requirements
 */
export async function generateProjectPDF(project: ProjectData): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads', 'projects');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate filename
      const filename = `project-${project.id}-${Date.now()}.pdf`;
      const filepath = path.join(uploadsDir, filename);

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      // Pipe to file
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Add content
      doc.fontSize(20).text('Project Requirements Document', { align: 'center' });
      doc.moveDown();

      doc.fontSize(14).text('Project Details', { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(12);
      doc.text(`Project ID: ${project.id}`);
      doc.text(`Title: ${project.title}`);
      doc.text(`Created: ${new Date(project.createdAt).toLocaleDateString()}`);
      doc.moveDown();

      if (project.description) {
        doc.fontSize(14).text('Description', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(project.description, {
          align: 'left',
        });
        doc.moveDown();
      }

      doc.fontSize(14).text('Requirements', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Budget: $${project.budget.toLocaleString()}`);
      doc.text(`Timeframe: ${project.time}`);
      doc.moveDown(2);

      doc.fontSize(14).text('Terms and Conditions', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(
        'By signing this document, the client agrees to the project requirements and terms outlined above. ' +
        'The project will commence upon approval and signature.',
        {
          align: 'justify',
        }
      );
      doc.moveDown(2);

      // Add signature section
      doc.fontSize(14).text('Signature Section', { underline: true });
      doc.moveDown(1);
      doc.fontSize(12).text('Client Signature:');
      doc.moveDown(2);
      doc.lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);
      doc.fontSize(10).text('Date: _______________', { align: 'left' });

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        // Return relative path for storage in database
        const relativePath = `/uploads/projects/${filename}`;
        resolve(relativePath);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get PDF file path
 */
export function getProjectPDFPath(documentUrl: string): string {
  return path.join(process.cwd(), documentUrl);
}

/** Payment record for invoice PDF/image */
export interface InvoicePaymentRecord {
  amount: number;
  status: string;
  paymentMethod?: string;
  transactionId?: string;
  paidBy?: string;
  createdAt: string | Date;
  verifiedAt?: string | Date | null;
}

/** Invoice data for PDF generation */
export interface InvoicePDFData {
  id: number;
  invoiceNumber: string;
  issueDate: Date | string;
  dueDate: Date | string;
  totalAmount: number;
  totalPaid?: number;
  dueAmount?: number;
  status: string;
  notes?: string | null;
  payments?: InvoicePaymentRecord[];
  client?: { name?: string; contactInfo?: { email?: string; phone?: string } };
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    product?: { name?: string };
    service?: { title?: string };
  }>;
  project?: { title?: string };
  /** Company logo path (e.g. /uploads/theme/logo.png) - shown when file exists */
  companyLogoPath?: string | null;
}

/** Brand colors for invoice PDF */
const COLORS = {
  primary: '#4f46e5',
  primaryDark: '#3730a3',
  accent: '#f59e0b',
  text: '#1e293b',
  textMuted: '#64748b',
  border: '#e2e8f0',
  headerBg: '#f8fafc',
  rowAlt: '#f8fafc',
};

/**
 * Generate invoice PDF and pipe to response stream
 */
export function generateInvoicePDF(invoice: InvoicePDFData, outputStream: NodeJS.WritableStream): void {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(outputStream);

  // Use "Tk." - Helvetica doesn't support Bengali Taka (৳), causing garbled output
  const currency = 'Tk.';
  const pageWidth = doc.page.width - 80;
  const startX = 40;

  try {
    // Top accent bar
    doc.fillColor(COLORS.primary).rect(0, 0, doc.page.width, 6).fill();
    doc.y = 20;

    // Company logo (top-right, when available)
    if (invoice.companyLogoPath) {
      const logoPath = path.join(process.cwd(), invoice.companyLogoPath.replace(/^\//, ''));
      if (fs.existsSync(logoPath)) {
        try {
          const logoWidth = 70;
          const logoHeight = 35;
          doc.image(logoPath, doc.page.width - 40 - logoWidth, 15, { width: logoWidth, height: logoHeight });
        } catch (_) {
          // Skip logo if image fails to load
        }
      }
    }

    // Header section
    doc.fontSize(28).font('Helvetica-Bold').fillColor(COLORS.primary).text('INVOICE', startX, doc.y);
    doc.fontSize(14).font('Helvetica').fillColor(COLORS.textMuted).text(`#${invoice.invoiceNumber}`, startX, doc.y + 32);
    doc.y += 55;

    // Bill To & Invoice Details side by side - aligned at same baseline
    const col1End = startX + pageWidth / 2 - 20;
    const col2Start = col1End + 30;
    const sectionTop = doc.y;

    doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.text).text('Bill To', startX, sectionTop);
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.text);
    const client = invoice.client;
    const contentTop = sectionTop + 16;
    if (client) {
      doc.text(client.name || 'N/A', startX, contentTop);
      const ci = client.contactInfo && typeof client.contactInfo === 'object' ? client.contactInfo : null;
      let lineY = contentTop + 14;
      if (ci?.email) {
        doc.fillColor(COLORS.textMuted).text(ci.email, startX, lineY);
        lineY += 14;
      }
      if (ci?.phone) {
        doc.text(ci.phone, startX, lineY);
      }
    } else {
      doc.text('N/A', startX, contentTop);
    }

    // Invoice meta (right column) - same baseline as Bill To
    doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.text).text('Invoice Details', col2Start, sectionTop);
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.textMuted);
    doc.text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, col2Start, contentTop);
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, col2Start, contentTop + 14);
    const statusY = contentTop + 28;
    const statusColor = invoice.status === 'Paid' ? '#059669' : invoice.status === 'Overdue' ? '#dc2626' : '#d97706';
    doc.fillColor(statusColor).rect(col2Start, statusY - 4, 60, 20).fill();
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text(invoice.status, col2Start, statusY, { width: 60, align: 'center' });
    doc.fillColor(COLORS.text);
    if (invoice.project?.title) {
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.textMuted).text(`Project: ${invoice.project.title}`, col2Start, statusY + 24);
    }
    doc.y = Math.max(contentTop + (client ? 48 : 28), statusY + 36);
    doc.moveDown(1);

    // Items table
    doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.text).text('Items', startX, doc.y);
    doc.moveDown(0.8);

    const tableTop = doc.y;
    const colWidths = { desc: 240, qty: 45, price: 90, total: 95 };
    const rowHeight = 22;

    // Table header - Description left, Qty/Unit Price/Total right-aligned
    doc.fillColor(COLORS.headerBg).rect(startX, tableTop, pageWidth, rowHeight).fill();
    doc.strokeColor(COLORS.border).rect(startX, tableTop, pageWidth, rowHeight).stroke();
    doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.text);
    doc.text('Description', startX + 8, tableTop + 6, { width: colWidths.desc - 16 });
    doc.text('Qty', startX + colWidths.desc, tableTop + 6, { width: colWidths.qty, align: 'right' });
    doc.text('Unit Price', startX + colWidths.desc + colWidths.qty, tableTop + 6, { width: colWidths.price, align: 'right' });
    doc.text('Total', startX + colWidths.desc + colWidths.qty + colWidths.price, tableTop + 6, { width: colWidths.total - 8, align: 'right' });

    let y = tableTop + rowHeight;
    (invoice.items || []).forEach((item, idx) => {
      if (idx % 2 === 1) {
        doc.fillColor(COLORS.rowAlt).rect(startX, y, pageWidth, rowHeight).fill();
      }
      doc.strokeColor(COLORS.border).rect(startX, y, pageWidth, rowHeight).stroke();
      doc.fontSize(9).font('Helvetica').fillColor(COLORS.text);
      doc.text(item.description.substring(0, 50), startX + 8, y + 6, { width: colWidths.desc - 16 });
      doc.text(String(Number(item.quantity).toLocaleString()), startX + colWidths.desc, y + 6, { width: colWidths.qty, align: 'right' });
      doc.text(`${currency} ${Number(item.unitPrice).toLocaleString()}`, startX + colWidths.desc + colWidths.qty, y + 6, { width: colWidths.price, align: 'right' });
      doc.text(`${currency} ${Number(item.total).toLocaleString()}`, startX + colWidths.desc + colWidths.qty + colWidths.price, y + 6, { width: colWidths.total - 8, align: 'right' });
      y += rowHeight;
    });
    doc.y = y + 10;

    // Summary rows (Total, Paid, Due) - aligned with items table columns
    const totalBoxY = doc.y;
    const paid = invoice.totalPaid ?? 0;
    const due = invoice.dueAmount ?? Number(invoice.totalAmount);
    const summaryLabelX = startX + colWidths.desc;
    const summaryValueX = startX + colWidths.desc + colWidths.qty;
    const summaryValueWidth = colWidths.price + colWidths.total - 8;

    doc.fontSize(10).font('Helvetica').fillColor(COLORS.text);
    doc.text('Total Amount:', startX, totalBoxY, { width: summaryLabelX - startX });
    doc.text(`${currency} ${Number(invoice.totalAmount).toLocaleString()}`, summaryValueX, totalBoxY, { width: summaryValueWidth, align: 'right' });
    doc.y += 18;
    doc.text('Total Paid:', startX, doc.y, { width: summaryLabelX - startX });
    doc.text(`${currency} ${paid.toLocaleString()}`, summaryValueX, doc.y, { width: summaryValueWidth, align: 'right' });
    doc.y += 18;
    doc.fillColor(COLORS.primary).strokeColor(COLORS.primaryDark).rect(summaryValueX - 4, doc.y - 4, summaryValueWidth + 8, 24).fillAndStroke();
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#ffffff');
    doc.text('Due Amount:', startX, doc.y + 4, { width: summaryLabelX - startX });
    doc.text(`${currency} ${due.toLocaleString()} BDT`, summaryValueX, doc.y + 4, { width: summaryValueWidth, align: 'right' });
    doc.y += 32;
    doc.fillColor(COLORS.text);

    // Payment History
    const paymentList = invoice.payments || [];
    if (paymentList.length > 0) {
      doc.moveDown(0.8);
      doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.text).text('Payment History', startX, doc.y);
      doc.moveDown(0.5);
      const payTableTop = doc.y;
      const payColWidths = { method: 100, amount: 70, txn: 120, date: 100, status: 60 };
      doc.fillColor(COLORS.headerBg).rect(startX, payTableTop, pageWidth, 18).fill();
      doc.strokeColor(COLORS.border).rect(startX, payTableTop, pageWidth, 18).stroke();
      doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.text);
      doc.text('Method', startX + 6, payTableTop + 5);
      doc.text('Amount', startX + payColWidths.method, payTableTop + 5, { width: payColWidths.amount, align: 'right' });
      doc.text('Transaction ID', startX + payColWidths.method + payColWidths.amount + 6, payTableTop + 5);
      doc.text('Date', startX + payColWidths.method + payColWidths.amount + payColWidths.txn, payTableTop + 5, { width: payColWidths.date, align: 'right' });
      doc.text('Status', startX + payColWidths.method + payColWidths.amount + payColWidths.txn + payColWidths.date + 6, payTableTop + 5);
      let payY = payTableTop + 18;
      paymentList.forEach((p: InvoicePaymentRecord) => {
        doc.strokeColor(COLORS.border).rect(startX, payY, pageWidth, 16).stroke();
        doc.fontSize(8).font('Helvetica').fillColor(COLORS.text);
        doc.text((p.paymentMethod || '-').substring(0, 18), startX + 6, payY + 5);
        doc.text(`${currency} ${Number(p.amount).toLocaleString()}`, startX + payColWidths.method, payY + 5, { width: payColWidths.amount, align: 'right' });
        doc.text((p.transactionId || '-').substring(0, 20), startX + payColWidths.method + payColWidths.amount + 6, payY + 5);
        doc.text(new Date(p.createdAt).toLocaleDateString(), startX + payColWidths.method + payColWidths.amount + payColWidths.txn, payY + 5, { width: payColWidths.date, align: 'right' });
        doc.text(p.status || '-', startX + payColWidths.method + payColWidths.amount + payColWidths.txn + payColWidths.date + 6, payY + 5);
        payY += 16;
      });
      doc.y = payY + 8;
    }

    // Terms & Conditions
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text).text('Terms & Conditions', startX, doc.y);
    doc.font('Helvetica').fontSize(8).fillColor(COLORS.textMuted);
    const terms = [
      '• Payment is due within the specified due date. Late payments may incur additional charges.',
      '• All amounts are in Bangladeshi Taka (BDT).',
      '• This invoice is subject to our standard terms of service.',
      '• Please retain this document for your records.',
    ];
    terms.forEach((line) => {
      doc.text(line, startX, doc.y + 12, { width: pageWidth });
      doc.y += 14;
    });
    doc.y += 8;

    if (invoice.notes) {
      doc.fontSize(10).font('Helvetica-Bold').text('Notes', startX, doc.y);
      doc.font('Helvetica').fontSize(9).fillColor(COLORS.textMuted).text(invoice.notes.substring(0, 500), startX, doc.y + 16, { width: pageWidth });
      doc.y += 40;
    }

    // Footer
    doc.moveDown(1);
    doc.strokeColor(COLORS.border).moveTo(startX, doc.y).lineTo(startX + pageWidth, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor(COLORS.textMuted).text(
      `Generated on ${new Date().toLocaleString()} • Invoice #${invoice.invoiceNumber} • All amounts in Bangladeshi Taka (BDT)`,
      { align: 'center', width: doc.page.width - 80 }
    );

    doc.end();
  } catch (err) {
    doc.end();
    throw err;
  }
}

