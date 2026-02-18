import { appendFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { Request, Response } from 'express';
import { invoiceService } from '../services/invoice.service.js';
import { paymentService } from '../services/payment.service.js';
import { themeService } from '../services/theme.service.js';
import { transactionService } from '../services/transaction.service.js';
import { budgetService } from '../services/budget.service.js';
import { expenseCategoryService } from '../services/expenseCategory.service.js';
import { accountsService } from '../services/accounts.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../types/index.js';
import { z } from 'zod';
import { InvoiceStatus, TransactionType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';
import { generateInvoiceImage } from '../utils/invoiceImageGenerator.js';

const DEBUG_LOG = '/Applications/XAMPP/xamppfiles/htdocs/omni/.cursor/debug.log';
function debugLog(payload: object) {
  try { mkdirSync(dirname(DEBUG_LOG), { recursive: true }); appendFileSync(DEBUG_LOG, JSON.stringify(payload) + '\n'); } catch (_) {}
}

// Validation schemas
const createInvoiceSchema = z.object({
  companyId: z.number().int().positive(),
  clientId: z.number().int().positive(),
  invoiceNumber: z.string().optional(),
  issueDate: z.union([z.string(), z.coerce.date()]),
  dueDate: z.union([z.string(), z.coerce.date()]),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    productId: z.number().int().positive().optional(),
    serviceId: z.number().int().positive().optional(),
  })).min(1, 'At least one item is required'),
  notes: z.string().optional(),
});

const createInvoiceFromProjectSchema = z.object({
  projectId: z.coerce.number().int().positive(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.coerce.number().positive(),
    unitPrice: z.coerce.number().positive(),
    productId: z.coerce.number().int().positive().optional(),
    serviceId: z.coerce.number().int().positive().optional(),
  })).min(1, 'At least one item is required'),
  issueDate: z.union([z.string(), z.coerce.date()]).optional(),
  dueDate: z.union([z.string(), z.coerce.date()]).optional(),
  notes: z.string().optional(),
});

const createTransactionSchema = z.object({
  companyId: z.number().int().positive(),
  type: z.enum(['Credit', 'Debit']),
  categoryId: z.number().int().positive().optional(),
  amount: z.number().positive(),
  date: z.string().datetime().or(z.date()),
  description: z.string().optional(),
  reference: z.string().optional(),
});

const createBudgetSchema = z.object({
  companyId: z.number().int().positive(),
  name: z.string().min(1, 'Budget name is required'),
  categoryId: z.number().int().positive().optional(),
  amount: z.number().positive(),
  period: z.string().min(1),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
});

const createExpenseCategorySchema = z.object({
  companyId: z.number().int().positive(),
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
});

const createPayableSchema = z.object({
  companyId: z.number().int().positive(),
  vendorName: z.string().min(1, 'Vendor name is required'),
  amount: z.number().positive(),
  dueDate: z.string().datetime().or(z.date()),
  description: z.string().optional(),
});

const createReceivableSchema = z.object({
  companyId: z.number().int().positive(),
  clientId: z.number().int().positive().optional(),
  invoiceId: z.number().int().positive().optional(),
  amount: z.number().positive(),
  dueDate: z.string().datetime().or(z.date()),
  description: z.string().optional(),
});

export const financeController = {
  // ========== Invoice Methods ==========
  getAllInvoices: async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      if (isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const filters: any = {};
      if (req.query.status) filters.status = req.query.status as InvoiceStatus;
      if (req.query.clientId) filters.clientId = parseInt(req.query.clientId as string);

      const invoices = await invoiceService.getAllInvoices(companyId, filters);
      return sendSuccess(res, invoices, 'Invoices retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve invoices', 500);
    }
  },

  getInvoiceById: async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = req.user?.companyId || parseInt(req.query.companyId as string || req.body.companyId);
      
      if (isNaN(id) || isNaN(companyId)) {
        return sendError(res, 'Invalid ID', 400);
      }

      const invoice = await invoiceService.getInvoiceById(id, companyId);
      
      // If user is a client, verify they own this invoice
      if (req.user?.role?.name === 'Client') {
        const userEmail = req.user.email?.toLowerCase();
        const userId = req.user.id;
        let isAuthorized = false;
        
        // Check 1: Email matches client email
        const clientEmail = invoice.client?.contactInfo && typeof invoice.client.contactInfo === 'object'
          ? (invoice.client.contactInfo as any).email?.toLowerCase()
          : null;
        
        if (clientEmail && clientEmail === userEmail) {
          isAuthorized = true;
          console.log(`[Finance Controller] Client authorized via email match`);
        }
        
        // Check 2: Invoice is linked to a project owned by this user
        if (!isAuthorized && invoice.projectId && userId) {
          const project = await prisma.project.findFirst({
            where: {
              id: invoice.projectId,
              clientId: userId,
              companyId: companyId,
            },
          });
          
          if (project) {
            isAuthorized = true;
            console.log(`[Finance Controller] Client authorized via project ownership`);
          }
        }
        
        if (!isAuthorized) {
          console.log(`[Finance Controller] Unauthorized access attempt - userEmail: ${userEmail}, clientEmail: ${clientEmail}, userId: ${userId}`);
          return sendError(res, 'Unauthorized', 403);
        }
      }

      return sendSuccess(res, invoice, 'Invoice retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve invoice', 500);
    }
  },

  getInvoicePdf: async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = req.user?.companyId || parseInt(req.query.companyId as string);
      if (isNaN(id) || isNaN(companyId)) return sendError(res, 'Invalid ID', 400);

      const invoice = await invoiceService.getInvoiceById(id, companyId);

      if (req.user?.role?.name === 'Client') {
        const userEmail = req.user.email?.toLowerCase();
        const userId = req.user.id;
        const clientEmail = invoice.client?.contactInfo && typeof invoice.client.contactInfo === 'object'
          ? (invoice.client.contactInfo as any).email?.toLowerCase()
          : null;
        let isAuthorized = clientEmail === userEmail;
        if (!isAuthorized && invoice.projectId && userId) {
          const project = await prisma.project.findFirst({
            where: { id: invoice.projectId, clientId: userId, companyId },
          });
          if (project) isAuthorized = true;
        }
        if (!isAuthorized) return sendError(res, 'Unauthorized', 403);
      }

      const payments = await paymentService.getPaymentsByInvoice(id, companyId);
      const totalPaid = payments
        .filter((p: any) => p.status === 'Approved')
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      const dueAmount = Math.max(0, Number(invoice.totalAmount) - totalPaid);

      let companyLogoPath: string | null = null;
      try {
        const header = await themeService.getHeaderSettings(companyId);
        companyLogoPath = header?.logo || null;
        if (!companyLogoPath) {
          const theme = await themeService.getThemeSettings(companyId);
          companyLogoPath = theme?.siteLogo || null;
        }
      } catch (_) {
        companyLogoPath = null;
      }

      const filename = `invoice-${invoice.invoiceNumber.replace(/\s/g, '-')}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      generateInvoicePDF(
        {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          totalAmount: Number(invoice.totalAmount),
          totalPaid,
          dueAmount,
          status: invoice.status,
          notes: invoice.notes,
          client: invoice.client ? {
            name: invoice.client.name,
            contactInfo: invoice.client.contactInfo as any,
          } : undefined,
          items: invoice.items?.map((i: any) => ({
            description: i.description,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
            total: Number(i.total),
            product: i.product,
            service: i.service,
          })),
          payments: payments.map((p: any) => ({
            amount: Number(p.amount),
            status: p.status,
            paymentMethod: p.paymentMethod,
            transactionId: p.transactionId,
            paidBy: p.paidBy,
            createdAt: p.createdAt,
            verifiedAt: p.verifiedAt,
          })),
          project: invoice.project ? { title: invoice.project.title } : undefined,
          companyLogoPath,
        },
        res
      );
    } catch (error) {
      if (error instanceof AppError) return sendError(res, error.message, error.statusCode);
      return sendError(res, 'Failed to generate PDF', 500);
    }
  },

  getInvoiceImage: async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = req.user?.companyId || parseInt(req.query.companyId as string);
      if (isNaN(id) || isNaN(companyId)) return sendError(res, 'Invalid ID', 400);

      const invoice = await invoiceService.getInvoiceById(id, companyId);

      if (req.user?.role?.name === 'Client') {
        const userEmail = req.user.email?.toLowerCase();
        const userId = req.user.id;
        const clientEmail = invoice.client?.contactInfo && typeof invoice.client.contactInfo === 'object'
          ? (invoice.client.contactInfo as any).email?.toLowerCase()
          : null;
        let isAuthorized = clientEmail === userEmail;
        if (!isAuthorized && invoice.projectId && userId) {
          const project = await prisma.project.findFirst({
            where: { id: invoice.projectId, clientId: userId, companyId },
          });
          if (project) isAuthorized = true;
        }
        if (!isAuthorized) return sendError(res, 'Unauthorized', 403);
      }

      const payments = await paymentService.getPaymentsByInvoice(id, companyId);
      const totalPaid = payments
        .filter((p: any) => p.status === 'Approved')
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      const dueAmount = Math.max(0, Number(invoice.totalAmount) - totalPaid);

      let companyLogoPath: string | null = null;
      try {
        const header = await themeService.getHeaderSettings(companyId);
        companyLogoPath = header?.logo || null;
        if (!companyLogoPath) {
          const theme = await themeService.getThemeSettings(companyId);
          companyLogoPath = theme?.siteLogo || null;
        }
      } catch (_) {
        companyLogoPath = null;
      }

      const buffer = await generateInvoiceImage({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        totalAmount: Number(invoice.totalAmount),
        totalPaid,
        dueAmount,
        status: invoice.status,
        notes: invoice.notes,
        client: invoice.client ? {
          name: invoice.client.name,
          contactInfo: invoice.client.contactInfo as any,
        } : undefined,
        items: invoice.items?.map((i: any) => ({
          description: i.description,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          total: Number(i.total),
        })),
        payments: payments.map((p: any) => ({
          amount: Number(p.amount),
          status: p.status,
          paymentMethod: p.paymentMethod,
          transactionId: p.transactionId,
          paidBy: p.paidBy,
          createdAt: p.createdAt,
          verifiedAt: p.verifiedAt,
        })),
        project: invoice.project ? { title: invoice.project.title } : undefined,
        companyLogoPath,
      });

      const filename = `invoice-${invoice.invoiceNumber.replace(/\s/g, '-')}.png`;
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      if (error instanceof AppError) return sendError(res, error.message, error.statusCode);
      return sendError(res, 'Failed to generate image', 500);
    }
  },

  getClientInvoices: async (req: AuthRequest, res: Response) => {
    try {
      const userEmail = req.user?.email;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      console.log(`[Finance Controller] getClientInvoices called for email: ${userEmail}, companyId: ${companyId}, userId: ${userId}`);

      if (!userEmail || !companyId) {
        console.error(`[Finance Controller] Missing userEmail or companyId`);
        return sendError(res, 'User not authenticated', 401);
      }

      const invoices = await invoiceService.getClientInvoices(userEmail.toLowerCase(), companyId, userId);
      console.log(`[Finance Controller] Returning ${invoices.length} invoice(s)`);
      return sendSuccess(res, invoices, 'Invoices retrieved successfully');
    } catch (error) {
      console.error(`[Finance Controller] Error in getClientInvoices:`, error);
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve invoices', 500);
    }
  },

  createInvoice: async (req: Request, res: Response) => {
    try {
      // #region agent log
      debugLog({location:'finance.controller.ts:req.body',message:'Raw req.body before Zod parse',data:{itemsSample: (req.body as {items?: unknown[]})?.items?.slice(0,2), item0Keys: (req.body as {items?: unknown[]})?.items?.[0] ? Object.keys((req.body as {items?: unknown[]}).items[0] as object) : []},timestamp:Date.now(),hypothesisId:'E'});
      // #endregion
      const validatedData = createInvoiceSchema.parse(req.body);
      // #region agent log
      debugLog({location:'finance.controller.ts:validatedData',message:'Validated items after Zod',data:{validatedItem0Keys: validatedData.items[0] ? Object.keys(validatedData.items[0] as object) : [], hasProduct: validatedData.items.some((i: Record<string, unknown>) => 'product' in i)},timestamp:Date.now(),hypothesisId:'E'});
      // #endregion
      const invoiceNumber = validatedData.invoiceNumber || await invoiceService.generateInvoiceNumber(validatedData.companyId);
      
      const invoice = await invoiceService.createInvoice({
        ...validatedData,
        invoiceNumber,
        issueDate: validatedData.issueDate instanceof Date ? validatedData.issueDate : new Date(validatedData.issueDate),
        dueDate: validatedData.dueDate instanceof Date ? validatedData.dueDate : new Date(validatedData.dueDate),
      });
      return sendSuccess(res, invoice, 'Invoice created successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Finance Controller] createInvoice error:', message, error);
      return sendError(
        res,
        process.env.NODE_ENV === 'development' ? message : 'Failed to create invoice',
        500
      );
    }
  },

  renewInvoice: async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = req.user?.companyId;
      const userId = req.user?.id;
      const roleName = req.user?.role?.name ?? (req.user as any)?.roleName;
      const hasManageInvoices = (req.user as any)?.permissions?.can_manage_invoices;

      if (isNaN(id) || !companyId) return sendError(res, 'Invalid request', 400);

      if (roleName === 'Client') {
        const invoice = await prisma.invoice.findFirst({
          where: { id, companyId },
          include: { project: true },
        });
        if (!invoice) return sendError(res, 'Invoice not found', 404);
        if (!invoice.projectId || invoice.project?.clientId !== userId) {
          return sendError(res, 'Unauthorized', 403);
        }
      } else if (!hasManageInvoices && roleName !== 'SuperAdmin') {
        return sendError(res, 'Unauthorized', 403);
      }

      const invoice = await invoiceService.renewInvoice(id, companyId, userId);
      return sendSuccess(res, invoice, 'Invoice renewed successfully', 201);
    } catch (error) {
      if (error instanceof AppError) return sendError(res, error.message, error.statusCode);
      return sendError(res, 'Failed to renew invoice', 500);
    }
  },

  createInvoiceFromProject: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) return sendError(res, 'Company ID is required', 400);
      const validatedData = createInvoiceFromProjectSchema.parse(req.body);
      const invoice = await invoiceService.createInvoiceFromProject(companyId, validatedData.projectId, {
        items: validatedData.items,
        issueDate: validatedData.issueDate ? (validatedData.issueDate instanceof Date ? validatedData.issueDate : new Date(validatedData.issueDate)) : undefined,
        dueDate: validatedData.dueDate ? (validatedData.dueDate instanceof Date ? validatedData.dueDate : new Date(validatedData.dueDate)) : undefined,
        notes: validatedData.notes,
      });
      return sendSuccess(res, invoice, 'Invoice created successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) return sendError(res, error.errors[0].message, 400);
      if (error instanceof AppError) return sendError(res, error.message, error.statusCode);
      return sendError(res, 'Failed to create invoice', 500);
    }
  },

  updateInvoice: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string || req.body.companyId);
      
      if (isNaN(id) || isNaN(companyId)) {
        return sendError(res, 'Invalid ID', 400);
      }

      const validatedData = createInvoiceSchema.partial().parse(req.body);
      const invoice = await invoiceService.updateInvoice(id, companyId, {
        ...validatedData,
        issueDate: validatedData.issueDate ? (validatedData.issueDate instanceof Date ? validatedData.issueDate : new Date(validatedData.issueDate)) : undefined,
        dueDate: validatedData.dueDate ? (validatedData.dueDate instanceof Date ? validatedData.dueDate : new Date(validatedData.dueDate)) : undefined,
      });
      return sendSuccess(res, invoice, 'Invoice updated successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to update invoice', 500);
    }
  },

  deleteInvoice: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string || req.body.companyId);
      
      if (isNaN(id) || isNaN(companyId)) {
        return sendError(res, 'Invalid ID', 400);
      }

      await invoiceService.deleteInvoice(id, companyId);
      return sendSuccess(res, null, 'Invoice deleted successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to delete invoice', 500);
    }
  },

  // ========== Transaction Methods ==========
  getAllTransactions: async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      if (isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const filters: any = {};
      if (req.query.type) filters.type = req.query.type as TransactionType;
      if (req.query.categoryId) filters.categoryId = parseInt(req.query.categoryId as string);
      if (req.query.startDate && req.query.endDate) {
        filters.startDate = new Date(req.query.startDate as string);
        filters.endDate = new Date(req.query.endDate as string);
      }

      const transactions = await transactionService.getAllTransactions(companyId, filters);
      return sendSuccess(res, transactions, 'Transactions retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve transactions', 500);
    }
  },

  createTransaction: async (req: Request, res: Response) => {
    try {
      const validatedData = createTransactionSchema.parse(req.body);
      const transaction = await transactionService.createTransaction({
        ...validatedData,
        date: validatedData.date instanceof Date ? validatedData.date : new Date(validatedData.date),
      });
      return sendSuccess(res, transaction, 'Transaction created successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to create transaction', 500);
    }
  },

  getFinancialSummary: async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      if (isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const summary = await transactionService.getFinancialSummary(companyId, startDate, endDate);
      return sendSuccess(res, summary, 'Financial summary retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve financial summary', 500);
    }
  },

  // ========== Budget Methods ==========
  getAllBudgets: async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      if (isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const budgets = await budgetService.getAllBudgets(companyId);
      return sendSuccess(res, budgets, 'Budgets retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve budgets', 500);
    }
  },

  createBudget: async (req: Request, res: Response) => {
    try {
      const validatedData = createBudgetSchema.parse(req.body);
      const budget = await budgetService.createBudget({
        ...validatedData,
        startDate: validatedData.startDate instanceof Date ? validatedData.startDate : new Date(validatedData.startDate),
        endDate: validatedData.endDate instanceof Date ? validatedData.endDate : new Date(validatedData.endDate),
      });
      return sendSuccess(res, budget, 'Budget created successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to create budget', 500);
    }
  },

  // ========== Expense Category Methods ==========
  getAllCategories: async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      if (isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const categories = await expenseCategoryService.getAllCategories(companyId);
      return sendSuccess(res, categories, 'Categories retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve categories', 500);
    }
  },

  createCategory: async (req: Request, res: Response) => {
    try {
      const validatedData = createExpenseCategorySchema.parse(req.body);
      const category = await expenseCategoryService.createCategory(validatedData);
      return sendSuccess(res, category, 'Category created successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to create category', 500);
    }
  },

  // ========== Accounts Payable/Receivable Methods ==========
  getAllPayables: async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      if (isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const filters: any = {};
      if (req.query.status) filters.status = req.query.status as string;

      const payables = await accountsService.getAllPayables(companyId, filters);
      return sendSuccess(res, payables, 'Accounts payable retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve accounts payable', 500);
    }
  },

  getAllReceivables: async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      if (isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const filters: any = {};
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.clientId) filters.clientId = parseInt(req.query.clientId as string);

      const receivables = await accountsService.getAllReceivables(companyId, filters);
      return sendSuccess(res, receivables, 'Accounts receivable retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve accounts receivable', 500);
    }
  },

  createPayable: async (req: Request, res: Response) => {
    try {
      const validatedData = createPayableSchema.parse(req.body);
      const payable = await accountsService.createPayable({
        ...validatedData,
        dueDate: validatedData.dueDate instanceof Date ? validatedData.dueDate : new Date(validatedData.dueDate),
      });
      return sendSuccess(res, payable, 'Account payable created successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to create account payable', 500);
    }
  },

  createReceivable: async (req: Request, res: Response) => {
    try {
      const validatedData = createReceivableSchema.parse(req.body);
      const receivable = await accountsService.createReceivable({
        ...validatedData,
        dueDate: validatedData.dueDate instanceof Date ? validatedData.dueDate : new Date(validatedData.dueDate),
      });
      return sendSuccess(res, receivable, 'Account receivable created successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to create account receivable', 500);
    }
  },
};

