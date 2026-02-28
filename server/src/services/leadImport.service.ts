import ExcelJS from 'exceljs';
import { prisma } from '../lib/prisma.js';
import { leadService } from './lead.service.js';
import { leadStatusConfigService } from './leadStatusConfig.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { LeadSource } from '@prisma/client';
import { z } from 'zod';

const rowSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  customer_name: z.string().min(1, 'Customer name is required'),
  phone: z.string().optional(),
  description: z.string().optional(),
  value: z.union([z.number(), z.string()]).optional().transform((v) => {
    if (v === '' || v === null || v === undefined) return undefined;
    const n = Number(v);
    return isNaN(n) ? undefined : n;
  }),
  status: z.enum(['New', 'Contacted', 'Qualified', 'Negotiation', 'Won', 'Lost']).optional(),
  category: z.string().optional(),
  interest: z.string().optional(),
});

type ParsedRow = z.infer<typeof rowSchema>;

const STATUS_OPTIONS = 'New,Contacted,Qualified,Negotiation,Won,Lost';

export const leadImportService = {
  /**
   * Generate template Excel file with headers, example row, and dropdowns for category/interest/status
   */
  async generateTemplate(companyId: number): Promise<Buffer> {
    const [categories, interests] = await Promise.all([
      prisma.leadCategory.findMany({ where: { companyId, isActive: true }, select: { name: true }, orderBy: { name: 'asc' } }),
      prisma.leadInterest.findMany({ where: { companyId, isActive: true }, select: { name: true }, orderBy: { name: 'asc' } }),
    ]);

    const wb = new ExcelJS.Workbook();
    const optsSheet = wb.addWorksheet('Options', { state: 'hidden' });
    optsSheet.getColumn(1).width = 30;
    optsSheet.getColumn(2).width = 30;
    optsSheet.getCell('A1').value = 'Category';
    optsSheet.getCell('B1').value = 'Interest';
    categories.forEach((c, i) => { optsSheet.getCell(i + 2, 1).value = c.name; });
    interests.forEach((i, idx) => { optsSheet.getCell(idx + 2, 2).value = i.name; });
    const catLastRow = categories.length > 0 ? categories.length + 1 : 2;
    const intLastRow = interests.length > 0 ? interests.length + 1 : 2;

    const ws = wb.addWorksheet('Leads', { firstSheet: true });
    const headers = ['title (অবশ্যই)', 'customer_name (অবশ্যই)', 'phone', 'description', 'value', 'status', 'category', 'interest'];
    const exampleRow = ['নতুন লিড', 'গ্রাহক এর নাম', '01712345678', 'বিবরণ বা নোট', '5000', 'New', categories[0]?.name || '', interests[0]?.name || ''];
    ws.addRow(headers);
    ws.addRow(exampleRow);

    for (let r = 2; r <= 500; r++) {
      ws.getCell(r, 6).dataValidation = { type: 'list', allowBlank: true, formulae: [`"${STATUS_OPTIONS}"`] };
      if (categories.length > 0) ws.getCell(r, 7).dataValidation = { type: 'list', allowBlank: true, formulae: [`Options!$A$2:$A$${catLastRow}`] };
      if (interests.length > 0) ws.getCell(r, 8).dataValidation = { type: 'list', allowBlank: true, formulae: [`Options!$B$2:$B$${intLastRow}`] };
    }

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  },

  /**
   * Extract plain value from cell (handles rich text, Cell objects, etc.)
   */
  _cellValue(val: unknown): string | number | undefined {
    if (val == null || val === '') return undefined;
    if (typeof val === 'number' && !isNaN(val)) return val;
    if (typeof val === 'string') return val.trim() || undefined;
    if (typeof val === 'object' && val !== null && 'richText' in val) {
      const rt = (val as { richText?: { text?: string }[] }).richText;
      if (Array.isArray(rt)) return rt.map((s) => s?.text ?? '').join('').trim() || undefined;
    }
    if (typeof val === 'object' && val !== null && 'text' in val) {
      return String((val as { text: unknown }).text).trim() || undefined;
    }
    const s = String(val).trim();
    return s === '' || s === '[object Object]' ? undefined : s;
  },

  /**
   * Parse Excel file and validate rows (using ExcelJS - same lib as template generation)
   */
  async parseExcelFile(
    filePath: string,
    companyId: number
  ): Promise<{ valid: ParsedRow[]; errors: { row: number; message: string }[] }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet =
      workbook.getWorksheet('Leads') || workbook.worksheets[0] || workbook.getWorksheet(1);
    if (!worksheet) {
      throw new AppError('Excel file has no worksheets', 400);
    }

    const rows: (string | number | undefined)[][] = [];
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      const raw = (row.values as (string | number | undefined)[]) || [];
      const values = raw.slice(1).map((v) => this._cellValue(v));
      rows.push(values);
    });

    const valid: ParsedRow[] = [];
    const errors: { row: number; message: string }[] = [];

    const toKey = (h: unknown): string => {
      if (h == null) return '';
      let s = String(h).trim();
      s = s.replace(/\s*\([^)]*\)\s*$/g, '').trim();
      const m = s.match(/^([a-z0-9_]+)/i);
      return (m ? m[1] : s).toLowerCase().replace(/\s/g, '_');
    };

    let headerRow: string[] = [];
    let headerRowIndex = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!Array.isArray(row)) continue;

      const normalized = row.map((c) => toKey(c));
      const hasTitle = normalized.some((k) => k === 'title');
      const hasCustomerName =
        normalized.some((k) => k === 'customer_name') || normalized.some((k) => k === 'customername');

      if (hasTitle && (hasCustomerName || normalized.some((k) => k === 'customer'))) {
        headerRow = normalized.map((k) => (k === 'customername' ? 'customer_name' : k));
        headerRowIndex = i;
        break;
      }
    }

    if (headerRow.length === 0 || !headerRow.includes('title') || !headerRow.includes('customer_name')) {
      throw new AppError(
        'Could not find required column headers. Expect: title, customer_name (or customer).',
        400
      );
    }

    for (let i = 0; i < rows.length; i++) {
      if (i <= headerRowIndex) continue;
      const row = rows[i];
      if (!Array.isArray(row)) continue;

      const isEmpty = row.every((c) => c === undefined || c === '' || (typeof c === 'string' && !c.trim()));
      if (isEmpty) continue;

      const obj: Record<string, unknown> = {};
      headerRow.forEach((key, idx) => {
        if (key) obj[key] = row[idx];
      });

      const mapped: Record<string, unknown> = {
        title: obj.title ?? obj.titel,
        customer_name: obj.customer_name ?? obj.customername ?? obj.customer ?? obj.name,
        phone: obj.phone,
        description: obj.description ?? obj.desc,
        value: obj.value,
        status: obj.status,
        category: obj.category,
        interest: obj.interest,
      };

      const result = rowSchema.safeParse(mapped);
      const rowNum = i + 1;

      if (result.success) {
        valid.push(result.data);
      } else {
        const msg = result.error.errors.map((e) => e.message).join('; ');
        errors.push({ row: rowNum, message: msg });
      }
    }

    return { valid, errors };
  },

  /**
   * Resolve category and interest by name
   */
  async resolveCategoryAndInterest(
    companyId: number,
    categoryName?: string,
    interestName?: string
  ): Promise<{ categoryId: number | null; interestId: number | null }> {
    let categoryId: number | null = null;
    let interestId: number | null = null;

    if (categoryName && String(categoryName).trim()) {
      const cat = await prisma.leadCategory.findFirst({
        where: {
          companyId,
          name: String(categoryName).trim(),
        },
      });
      categoryId = cat?.id ?? null;
    }

    if (interestName && String(interestName).trim()) {
      const int = await prisma.leadInterest.findFirst({
        where: {
          companyId,
          name: String(interestName).trim(),
        },
      });
      interestId = int?.id ?? null;
    }

    return { categoryId, interestId };
  },

  /**
   * Import leads from Excel file
   */
  async importLeadsFromExcel(
    filePath: string,
    companyId: number,
    userId: string,
    fileName: string
  ): Promise<{
    successCount: number;
    errorCount: number;
    totalRows: number;
    errors: { row: number; message: string }[];
  }> {
    const { valid, errors } = await this.parseExcelFile(filePath, companyId);

    const totalRows = valid.length + errors.length;
    if (totalRows === 0) {
      throw new AppError('Excel file has no data rows', 400);
    }
    if (valid.length === 0) {
      throw new AppError('No valid rows to import. Check required columns: title, customer_name.', 400);
    }

    const batch = await prisma.leadImport.create({
      data: {
        companyId,
        uploadedBy: userId,
        fileName,
        totalRows,
        successCount: 0,
        errorCount: errors.length,
        errorDetails: errors.length > 0 ? (errors as object) : null,
      },
    });

    let successCount = 0;

    for (const row of valid) {
      try {
        const { categoryId, interestId } = await this.resolveCategoryAndInterest(
          companyId,
          row.category,
          row.interest
        );

        let statusId = await leadStatusConfigService.resolveStatusId(
          companyId,
          row.status ?? ''
        );
        if (!statusId) {
          statusId = await leadStatusConfigService.getDefaultStatusId(companyId);
        }

        await leadService.createLead({
          companyId,
          createdBy: userId,
          title: row.title,
          customerName: row.customer_name,
          phone: row.phone ?? undefined,
          description: row.description ?? undefined,
          value: row.value,
          statusId,
          categoryId: categoryId ?? undefined,
          interestId: interestId ?? undefined,
          source: 'Excel' as LeadSource,
          leadImportId: batch.id,
        });

        successCount++;
      } catch (err) {
        errors.push({
          row: successCount + errors.length + 1,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    await prisma.leadImport.update({
      where: { id: batch.id },
      data: {
        successCount,
        errorCount: errors.length,
        errorDetails: errors.length > 0 ? (errors as object) : null,
      },
    });

    return {
      successCount,
      errorCount: errors.length,
      totalRows,
      errors: errors.slice(0, 20),
    };
  },
};
