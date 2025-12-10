import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

interface CreatePaymentGatewayData {
  companyId: number;
  name: string;
  accountType: string;
  accountNumber: string;
  instructions?: string;
  isActive?: boolean;
}

interface UpdatePaymentGatewayData {
  name?: string;
  accountType?: string;
  accountNumber?: string;
  instructions?: string;
  isActive?: boolean;
}

export const paymentGatewayService = {
  /**
   * Get all payment gateways for a company
   */
  async getAll(companyId: number) {
    return await prisma.paymentGateway.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get active payment gateways for a company
   */
  async getActiveGateways(companyId: number) {
    return await prisma.paymentGateway.findMany({
      where: {
        companyId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  },

  /**
   * Get payment gateway by ID
   */
  async getById(id: number, companyId: number) {
    const gateway = await prisma.paymentGateway.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!gateway) {
      throw new AppError('Payment gateway not found', 404);
    }

    return gateway;
  },

  /**
   * Create a new payment gateway
   */
  async create(data: CreatePaymentGatewayData) {
    // Validate account number format (Bangladesh mobile number: 01XXXXXXXXX, 11 digits)
    const accountNumberRegex = /^01[3-9]\d{8}$/;
    if (!accountNumberRegex.test(data.accountNumber)) {
      throw new AppError('Invalid account number format. Must be a valid Bangladesh mobile number (01XXXXXXXXX)', 400);
    }

    // Validate account type
    const validAccountTypes = ['Personal', 'Payment', 'Agent'];
    if (!validAccountTypes.includes(data.accountType)) {
      throw new AppError('Invalid account type. Must be Personal, Payment, or Agent', 400);
    }

    return await prisma.paymentGateway.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        accountType: data.accountType,
        accountNumber: data.accountNumber,
        instructions: data.instructions,
        isActive: data.isActive ?? true,
      },
    });
  },

  /**
   * Update payment gateway
   */
  async update(id: number, companyId: number, data: UpdatePaymentGatewayData) {
    // Check if gateway exists
    const existing = await this.getById(id, companyId);

    // Validate account number if provided
    if (data.accountNumber) {
      const accountNumberRegex = /^01[3-9]\d{8}$/;
      if (!accountNumberRegex.test(data.accountNumber)) {
        throw new AppError('Invalid account number format. Must be a valid Bangladesh mobile number (01XXXXXXXXX)', 400);
      }
    }

    // Validate account type if provided
    if (data.accountType) {
      const validAccountTypes = ['Personal', 'Payment', 'Agent'];
      if (!validAccountTypes.includes(data.accountType)) {
        throw new AppError('Invalid account type. Must be Personal, Payment, or Agent', 400);
      }
    }

    return await prisma.paymentGateway.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.accountType && { accountType: data.accountType }),
        ...(data.accountNumber && { accountNumber: data.accountNumber }),
        ...(data.instructions !== undefined && { instructions: data.instructions }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  },

  /**
   * Delete payment gateway
   */
  async delete(id: number, companyId: number) {
    // Check if gateway exists
    await this.getById(id, companyId);

    // Check if gateway has any payments
    const paymentCount = await prisma.payment.count({
      where: {
        paymentGatewayId: id,
      },
    });

    if (paymentCount > 0) {
      throw new AppError('Cannot delete payment gateway with existing payments', 400);
    }

    return await prisma.paymentGateway.delete({
      where: { id },
    });
  },
};

