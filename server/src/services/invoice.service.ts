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
        project: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    return invoice;
  },

  /**
   * Get invoices for a client user (by email)
   */
  async getClientInvoices(userEmail: string, companyId: number) {
    // Find client by email in contactInfo using raw query for JSON search
    const clients = await prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id FROM clients
      WHERE company_id = ${companyId}
      AND JSON_EXTRACT(contact_info, '$.email') = ${userEmail}
    `;

    if (clients.length === 0) {
      return [];
    }

    const clientIds = clients.map(c => c.id);

    return await prisma.invoice.findMany({
      where: {
        companyId,
        clientId: {
          in: clientIds,
        },
      },
      include: {
        client: true,
        items: true,
        project: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
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

  /**
   * Generate invoice from project
   * Called when project status changes to "Submitted"
   */
  async generateInvoiceFromProject(projectId: number) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: {
          include: {
            company: true,
          },
        },
        company: true,
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Check if invoice already exists for this project
    const existingInvoice = await prisma.invoice.findFirst({
      where: { projectId },
    });

    if (existingInvoice) {
      return existingInvoice;
    }

    // Get or create client record from user
    let client = await prisma.client.findFirst({
      where: {
        companyId: project.companyId,
        contactInfo: {
          path: ['email'],
          equals: project.client.email,
        },
      },
    });

    // If client doesn't exist, create one from user data
    if (!client) {
      client = await prisma.client.create({
        data: {
          companyId: project.companyId,
          name: project.client.email.split('@')[0],
          contactInfo: {
            email: project.client.email,
          },
        },
      });
    }

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(project.companyId);

    // Set dates
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days from issue date

    // Create invoice with single item (the project)
    const invoice = await prisma.invoice.create({
      data: {
        companyId: project.companyId,
        clientId: client.id,
        projectId: project.id,
        invoiceNumber,
        issueDate,
        dueDate,
        totalAmount: project.budget,
        status: 'Unpaid',
        notes: `Invoice for project: ${project.title}`,
        items: {
          create: {
            description: project.title,
            quantity: 1,
            unitPrice: project.budget,
            total: project.budget,
          },
        },
      },
      include: {
        client: true,
        items: true,
        project: true,
      },
    });

    // Create account receivable
    await prisma.accountReceivable.create({
      data: {
        companyId: project.companyId,
        clientId: client.id,
        invoiceId: invoice.id,
        amount: project.budget,
        dueDate,
        status: 'Pending',
      },
    });

    return invoice;
  },
};

