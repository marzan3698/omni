import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

interface CreateAccountPayableData {
  companyId: number;
  vendorName: string;
  amount: number;
  dueDate: Date;
  description?: string;
}

interface CreateAccountReceivableData {
  companyId: number;
  clientId?: number;
  invoiceId?: number;
  amount: number;
  dueDate: Date;
  description?: string;
}

interface UpdateAccountData {
  amount?: number;
  dueDate?: Date;
  status?: string;
  description?: string;
  paidDate?: Date;
}

export const accountsService = {
  /**
   * Get all accounts payable for a company
   */
  async getAllPayables(companyId: number, filters?: {
    status?: string;
  }) {
    return await prisma.accountPayable.findMany({
      where: {
        companyId,
        ...(filters?.status && { status: filters.status }),
      },
      orderBy: { dueDate: 'asc' },
    });
  },

  /**
   * Get all accounts receivable for a company
   */
  async getAllReceivables(companyId: number, filters?: {
    status?: string;
    clientId?: number;
  }) {
    return await prisma.accountReceivable.findMany({
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
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  },

  /**
   * Get account payable by ID
   */
  async getPayableById(id: number, companyId: number) {
    const payable = await prisma.accountPayable.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!payable) {
      throw new AppError('Account payable not found', 404);
    }

    return payable;
  },

  /**
   * Get account receivable by ID
   */
  async getReceivableById(id: number, companyId: number) {
    const receivable = await prisma.accountReceivable.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        client: true,
        invoice: true,
      },
    });

    if (!receivable) {
      throw new AppError('Account receivable not found', 404);
    }

    return receivable;
  },

  /**
   * Create account payable
   */
  async createPayable(data: CreateAccountPayableData) {
    return await prisma.accountPayable.create({
      data: {
        companyId: data.companyId,
        vendorName: data.vendorName,
        amount: data.amount,
        dueDate: data.dueDate,
        description: data.description,
      },
    });
  },

  /**
   * Create account receivable
   */
  async createReceivable(data: CreateAccountReceivableData) {
    // Verify client if provided
    if (data.clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: data.clientId,
          companyId: data.companyId,
        },
      });

      if (!client) {
        throw new AppError('Client not found', 404);
      }
    }

    // Verify invoice if provided
    if (data.invoiceId) {
      const invoice = await prisma.invoice.findFirst({
        where: {
          id: data.invoiceId,
          companyId: data.companyId,
        },
      });

      if (!invoice) {
        throw new AppError('Invoice not found', 404);
      }
    }

    return await prisma.accountReceivable.create({
      data: {
        companyId: data.companyId,
        clientId: data.clientId,
        invoiceId: data.invoiceId,
        amount: data.amount,
        dueDate: data.dueDate,
        description: data.description,
      },
      include: {
        client: true,
        invoice: true,
      },
    });
  },

  /**
   * Update account payable
   */
  async updatePayable(id: number, companyId: number, data: UpdateAccountData) {
    const payable = await prisma.accountPayable.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!payable) {
      throw new AppError('Account payable not found', 404);
    }

    return await prisma.accountPayable.update({
      where: { id },
      data,
    });
  },

  /**
   * Update account receivable
   */
  async updateReceivable(id: number, companyId: number, data: UpdateAccountData) {
    const receivable = await prisma.accountReceivable.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!receivable) {
      throw new AppError('Account receivable not found', 404);
    }

    return await prisma.accountReceivable.update({
      where: { id },
      data,
      include: {
        client: true,
        invoice: true,
      },
    });
  },

  /**
   * Delete account payable
   */
  async deletePayable(id: number, companyId: number) {
    const payable = await prisma.accountPayable.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!payable) {
      throw new AppError('Account payable not found', 404);
    }

    return await prisma.accountPayable.delete({
      where: { id },
    });
  },

  /**
   * Delete account receivable
   */
  async deleteReceivable(id: number, companyId: number) {
    const receivable = await prisma.accountReceivable.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!receivable) {
      throw new AppError('Account receivable not found', 404);
    }

    return await prisma.accountReceivable.delete({
      where: { id },
    });
  },
};

