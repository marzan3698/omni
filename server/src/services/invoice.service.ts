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
    productId?: number;
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
    productId?: number;
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
            status: true,
            service: {
              select: {
                id: true,
                title: true,
                pricing: true,
                durationDays: true,
                useDeliveryDate: true,
              },
            },
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
   * Get invoices for a client user (by email and userId)
   * Uses multiple methods to find invoices:
   * 1. Find invoices via Client records (matching email)
   * 2. Find invoices via Projects (matching userId)
   */
  async getClientInvoices(userEmail: string, companyId: number, userId?: string) {
    console.log(`[Invoice Service] Getting client invoices for email: ${userEmail}, companyId: ${companyId}, userId: ${userId}`);
    
    const invoiceIds = new Set<number>();
    
    // Method 1: Find invoices via Client records (matching email in contactInfo)
    let clients: Array<{ id: number }> = [];
    try {
      clients = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
        `SELECT id FROM clients
         WHERE company_id = ?
         AND LOWER(JSON_UNQUOTE(JSON_EXTRACT(contact_info, '$.email'))) = LOWER(?)`,
        companyId,
        userEmail
      );
      console.log(`[Invoice Service] Found ${clients.length} client(s) matching email ${userEmail}`);
    } catch (error: any) {
      console.error(`[Invoice Service] Error finding clients by email:`, error.message);
      // Try alternative approach: get all clients and filter in memory
      const allClients = await prisma.client.findMany({
        where: { companyId },
        select: { id: true, contactInfo: true },
      });
      
      clients = allClients
        .filter(c => {
          if (!c.contactInfo || typeof c.contactInfo !== 'object') return false;
          const email = (c.contactInfo as any).email;
          return email && email.toLowerCase() === userEmail.toLowerCase();
        })
        .map(c => ({ id: c.id }));
      
      console.log(`[Invoice Service] Found ${clients.length} client(s) using alternative method`);
    }

    if (clients.length > 0) {
      const clientIds = clients.map(c => c.id);
      console.log(`[Invoice Service] Looking for invoices with clientIds: ${clientIds.join(', ')}`);
      
      const invoicesByClient = await prisma.invoice.findMany({
        where: {
          companyId,
          clientId: {
            in: clientIds,
          },
        },
        select: { id: true },
      });
      
      invoicesByClient.forEach(inv => invoiceIds.add(inv.id));
      console.log(`[Invoice Service] Found ${invoicesByClient.length} invoice(s) via Client records`);
    }

    // Method 2: Find invoices via Projects (matching userId)
    if (userId) {
      try {
        const projects = await prisma.project.findMany({
          where: {
            companyId,
            clientId: userId,
          },
          select: { id: true },
        });
        
        console.log(`[Invoice Service] Found ${projects.length} project(s) for userId ${userId}`);
        
        if (projects.length > 0) {
          const projectIds = projects.map(p => p.id);
          const invoicesByProject = await prisma.invoice.findMany({
            where: {
              companyId,
              projectId: {
                in: projectIds,
              },
            },
            select: { id: true },
          });
          
          invoicesByProject.forEach(inv => invoiceIds.add(inv.id));
          console.log(`[Invoice Service] Found ${invoicesByProject.length} invoice(s) via Projects`);
        }
      } catch (error: any) {
        console.error(`[Invoice Service] Error finding invoices via projects:`, error.message);
      }
    }

    if (invoiceIds.size === 0) {
      console.log(`[Invoice Service] No invoices found, returning empty array`);
      return [];
    }

    // Fetch full invoice data
    const invoiceIdArray = Array.from(invoiceIds);
    console.log(`[Invoice Service] Fetching ${invoiceIdArray.length} invoice(s) with full details`);

    const invoices = await prisma.invoice.findMany({
      where: {
        id: {
          in: invoiceIdArray,
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
            service: {
              select: {
                id: true,
                title: true,
                pricing: true,
                durationDays: true,
                useDeliveryDate: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`[Invoice Service] Returning ${invoices.length} invoice(s) for client`);
    return invoices;
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
            productId: item.productId ?? undefined,
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
   * Renew invoice (create new invoice for next period based on service durationDays)
   * Only for project-linked invoices with service that has durationDays
   */
  async renewInvoice(invoiceId: number, companyId: number, userId?: string): Promise<any> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
      include: { items: true, project: { include: { service: true } } },
    });
    if (!invoice) throw new AppError('Invoice not found', 404);
    if (!invoice.projectId) throw new AppError('Invoice is not linked to a project', 400);
    if (!invoice.project?.service) throw new AppError('Project has no service', 400);

    const service = invoice.project.service;
    if (!service.durationDays) throw new AppError('Service does not support renewal (no duration in days)', 400);

    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + service.durationDays);

    const invoiceNumber = await this.generateInvoiceNumber(companyId);
    const newInvoice = await prisma.invoice.create({
      data: {
        companyId,
        clientId: invoice.clientId,
        projectId: invoice.projectId,
        renewedFromId: invoiceId,
        invoiceNumber,
        issueDate: now,
        dueDate,
        totalAmount: invoice.totalAmount,
        status: 'Unpaid',
        notes: `Renewal of invoice ${invoice.invoiceNumber}`,
        items: {
          create: invoice.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            productId: item.productId,
          })),
        },
      },
      include: { client: true, items: true },
    });

    await prisma.accountReceivable.create({
      data: {
        companyId,
        clientId: invoice.clientId,
        invoiceId: newInvoice.id,
        amount: newInvoice.totalAmount,
        dueDate,
        status: 'Pending',
      },
    });

    return newInvoice;
  },

  /**
   * Check if invoice can be renewed (for client UI)
   */
  async canRenewInvoice(invoiceId: number, companyId: number, userId?: string): Promise<boolean> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
      include: { project: { include: { service: true } } },
    });
    if (!invoice || !invoice.projectId || !invoice.project?.service?.durationDays) return false;
    const due = new Date(invoice.dueDate);
    const now = new Date();
    return now >= due;
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
          productId: item.productId ?? undefined,
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
   * Create invoice from project with custom items (for Add Invoice flow)
   */
  async createInvoiceFromProject(companyId: number, projectId: number, data: {
    items: Array<{ description: string; quantity: number; unitPrice: number; productId?: number }>;
    issueDate?: Date;
    dueDate?: Date;
    notes?: string;
  }) {
    const project = await prisma.project.findUnique({
      where: { id: projectId, companyId },
      include: { client: true },
    });
    if (!project) throw new AppError('Project not found', 404);

    let client: any = null;
    try {
      const rawClients = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
        `SELECT id FROM clients WHERE company_id = ? AND LOWER(JSON_UNQUOTE(JSON_EXTRACT(contact_info, '$.email'))) = LOWER(?) LIMIT 1`,
        companyId,
        project.client.email
      );
      if (rawClients.length > 0) client = await prisma.client.findUnique({ where: { id: rawClients[0].id } });
    } catch (_) {
      const all = await prisma.client.findMany({ where: { companyId }, select: { id: true, contactInfo: true } });
      const found = all.find(
        (c) => c.contactInfo && typeof c.contactInfo === 'object' && (c.contactInfo as any).email?.toLowerCase() === project.client.email.toLowerCase()
      );
      if (found) client = found;
    }
    if (!client) {
      client = await prisma.client.create({
        data: {
          companyId,
          name: project.client.email.split('@')[0],
          contactInfo: { email: project.client.email.toLowerCase() },
        },
      });
    }

    const issueDate = data.issueDate || new Date();
    const dueDate = data.dueDate || (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d; })();
    const totalAmount = data.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const invoiceNumber = await this.generateInvoiceNumber(companyId);

    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        clientId: client.id,
        projectId,
        invoiceNumber,
        issueDate,
        dueDate,
        totalAmount,
        notes: data.notes || `Invoice for project: ${project.title}`,
        items: {
          create: data.items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            total: i.quantity * i.unitPrice,
            productId: i.productId,
          })),
        },
      },
      include: { client: true, items: true },
    });

    if (invoice.status === 'Unpaid') {
      await prisma.accountReceivable.create({
        data: {
          companyId,
          clientId: client.id,
          invoiceId: invoice.id,
          amount: totalAmount,
          dueDate,
          status: 'Pending',
        },
      });
    }
    return invoice;
  },

  /**
   * Generate invoice from project
   * Called when project status changes to "Submitted"
   */
  async generateInvoiceFromProject(projectId: number) {
    console.log(`[Invoice Service] Starting invoice generation for project ${projectId}`);
    
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: {
          include: {
            company: true,
          },
        },
        company: true,
        service: true,
      },
    });

    if (!project) {
      console.error(`[Invoice Service] Project ${projectId} not found`);
      throw new AppError('Project not found', 404);
    }

    console.log(`[Invoice Service] Project found: ${project.title}, Client: ${project.client.email}, Company: ${project.companyId}`);

    // Check if invoice already exists for this project
    const existingInvoice = await prisma.invoice.findFirst({
      where: { projectId },
    });

    if (existingInvoice) {
      console.log(`[Invoice Service] Invoice already exists for project ${projectId}: ${existingInvoice.invoiceNumber}`);
      return existingInvoice;
    }

    // Get or create client record from user email
    // First, try to find client by email using raw query (most accurate, case-insensitive)
    let client: any = null;
    try {
      const rawClients = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
        `SELECT id FROM clients WHERE company_id = ? AND LOWER(JSON_UNQUOTE(JSON_EXTRACT(contact_info, '$.email'))) = LOWER(?) LIMIT 1`,
        project.companyId,
        project.client.email
      );
      
      if (rawClients.length > 0) {
        client = await prisma.client.findUnique({ where: { id: rawClients[0].id } });
        console.log(`[Invoice Service] Found existing client: ${client?.id}`);
      }
    } catch (error: any) {
      console.error(`[Invoice Service] Error finding client by email:`, error.message);
    }

    // If client doesn't exist, create one from user data
    if (!client) {
      try {
        client = await prisma.client.create({
          data: {
            companyId: project.companyId,
            name: project.client.email.split('@')[0],
            contactInfo: {
              email: project.client.email.toLowerCase(),
            },
          },
        });
        console.log(`[Invoice Service] Created new client: ${client.id} for email ${project.client.email}`);
      } catch (error: any) {
        console.error(`[Invoice Service] Error creating client:`, error.message);
        throw new AppError(`Failed to create client: ${error.message}`, 500);
      }
    }

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(project.companyId);

    // Set dates
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days from issue date

    // Build invoice items from service attributes
    const items: Array<{ description: string; quantity: number; unitPrice: number; total: number }> = [];
    const service = project.service;

    const parseNumber = (val: any) => {
      const n = Number(val);
      return Number.isFinite(n) ? n : 0;
    };

    const breakdown: Array<{ label: string; amount: number }> = [];
    if (service?.attributes && typeof service.attributes === 'object') {
      // Support { keyValuePairs: { key: value } } or flat key/value map
      const kv =
        (service.attributes as any).keyValuePairs && typeof (service.attributes as any).keyValuePairs === 'object'
          ? (service.attributes as any).keyValuePairs
          : service.attributes;

      if (kv && typeof kv === 'object') {
        for (const [label, value] of Object.entries(kv)) {
          const amount = parseNumber(value);
          if (amount > 0) {
            breakdown.push({ label, amount });
          }
        }
      }
    }

    if (breakdown.length > 0) {
      breakdown.forEach((entry) => {
        items.push({
          description: entry.label,
          quantity: 1,
          unitPrice: entry.amount,
          total: entry.amount,
        });
      });

      const sum = items.reduce((acc, i) => acc + i.total, 0);
      const budget = Number(project.budget);
      const diff = budget - sum;
      if (Math.abs(diff) > 0.01) {
        items.push({
          description: 'Adjustment to match project budget',
          quantity: 1,
          unitPrice: diff,
          total: diff,
        });
      }
    } else {
      const basePrice = Number(project.budget || service?.pricing || 0);
      items.push({
        description: service?.title || project.title || 'Project Services',
        quantity: 1,
        unitPrice: basePrice,
        total: basePrice,
      });
    }

    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    console.log(`[Invoice Service] Creating invoice with ${items.length} items, total: ${totalAmount}`);

    // Create invoice with items
    let invoice;
    try {
      invoice = await prisma.invoice.create({
        data: {
          companyId: project.companyId,
          clientId: client.id,
          projectId: project.id,
          invoiceNumber,
          issueDate,
          dueDate,
          totalAmount,
          status: 'Unpaid',
          notes: `Invoice for project: ${project.title}`,
          items: {
            create: items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
            })),
          },
        },
        include: {
          client: true,
          items: true,
          project: {
            include: {
              service: true,
            },
          },
        },
      });
      console.log(`[Invoice Service] Invoice created successfully: ${invoice.invoiceNumber} (ID: ${invoice.id})`);
    } catch (error: any) {
      console.error(`[Invoice Service] Error creating invoice:`, error.message);
      console.error(`[Invoice Service] Error stack:`, error.stack);
      throw new AppError(`Failed to create invoice: ${error.message}`, 500);
    }

    // Create account receivable
    try {
      await prisma.accountReceivable.create({
        data: {
          companyId: project.companyId,
          clientId: client.id,
          invoiceId: invoice.id,
          amount: totalAmount,
          dueDate,
          status: 'Pending',
        },
      });
      console.log(`[Invoice Service] Account receivable created for invoice ${invoice.id}`);
    } catch (error: any) {
      console.error(`[Invoice Service] Error creating account receivable:`, error.message);
      // Don't fail if account receivable creation fails, invoice is already created
    }

    return invoice;
  },
};

