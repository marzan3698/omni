import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { InvoiceStatus } from '@prisma/client';

interface CreateInvoiceData {
  companyId: number;
  clientId: number;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  notes?: string;
}

interface UpdateInvoiceData {
  clientId?: number;
  issueDate?: Date;
  dueDate?: Date;
  status?: InvoiceStatus;
  notes?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export const invoiceService = {
  /**
   * Generate unique invoice number
   */
  async generateInvoiceNumber(companyId: number): Promise<string> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        companyId,
        invoiceNumber: {
          startsWith: prefix,
        },
      },
      orderBy: { invoiceNumber: 'desc' },
    });

    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2] || '0');
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  },

  /**
   * Get all invoices for a company
   */
  async getAllInvoices(companyId: number, filters?: {
    status?: InvoiceStatus;
    clientId?: number;
  }) {
    return await prisma.invoice.findMany({
      where: {
        companyId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.clientId && { clientId: filters.clientId }),
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            contactInfo: true,
          },
        },
        items: true,
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: number, companyId: number) {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        client: true,
        items: true,
      },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    return invoice;
  },

  /**
   * Create invoice
   */
  async createInvoice(data: CreateInvoiceData) {
    // Verify client exists
    const client = await prisma.client.findFirst({
      where: {
        id: data.clientId,
        companyId: data.companyId,
      },
    });

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    // Calculate total amount
    const totalAmount = data.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        companyId: data.companyId,
        clientId: data.clientId,
        invoiceNumber: data.invoiceNumber,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        totalAmount,
        notes: data.notes,
        items: {
          create: data.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        client: true,
        items: true,
      },
    });

    // Create account receivable if invoice is unpaid
    if (invoice.status === 'Unpaid') {
      await prisma.accountReceivable.create({
        data: {
          companyId: data.companyId,
          clientId: data.clientId,
          invoiceId: invoice.id,
          amount: totalAmount,
          dueDate: data.dueDate,
          status: 'Pending',
        },
      });
    }

    return invoice;
  },

  /**
   * Update invoice
   */
  async updateInvoice(id: number, companyId: number, data: UpdateInvoiceData) {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        items: true,
      },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    // If client is being updated, verify it exists
    if (data.clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: data.clientId,
          companyId,
        },
      });

      if (!client) {
        throw new AppError('Client not found', 404);
      }
    }

    // Calculate new total if items are being updated
    let totalAmount = invoice.totalAmount;
    if (data.items) {
      totalAmount = data.items.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice);
      }, 0);
    }

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        clientId: data.clientId,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        status: data.status,
        notes: data.notes,
        totalAmount,
      },
      include: {
        client: true,
        items: true,
      },
    });

    // Update items if provided
    if (data.items) {
      // Delete existing items
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      // Create new items
      await prisma.invoiceItem.createMany({
        data: data.items.map(item => ({
          invoiceId: id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      });

      // Reload invoice with items
      return await this.getInvoiceById(id, companyId);
    }

    // Update account receivable if status changed
    if (data.status === 'Paid') {
      await prisma.accountReceivable.updateMany({
        where: { invoiceId: id },
        data: {
          status: 'Paid',
          paidDate: new Date(),
        },
      });
    }

    return updatedInvoice;
  },

  /**
   * Delete invoice
   */
  async deleteInvoice(id: number, companyId: number) {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    return await prisma.invoice.delete({
      where: { id },
    });
  },
};

