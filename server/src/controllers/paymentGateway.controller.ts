import { Response } from 'express';
import { paymentGatewayService } from '../services/paymentGateway.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../types/index.js';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

// Validation schemas
const createPaymentGatewaySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  accountType: z.enum(['Personal', 'Payment', 'Agent'], {
    errorMap: () => ({ message: 'Account type must be Personal, Payment, or Agent' }),
  }),
  accountNumber: z.string().min(1, 'Account number is required').max(20, 'Account number must be less than 20 characters'),
  instructions: z.string().max(5000, 'Instructions must be less than 5000 characters').optional(),
  isActive: z.boolean().optional(),
});

const updatePaymentGatewaySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  accountType: z.enum(['Personal', 'Payment', 'Agent']).optional(),
  accountNumber: z.string().min(1).max(20).optional(),
  instructions: z.string().max(5000).optional(),
  isActive: z.boolean().optional(),
});

export const paymentGatewayController = {
  /**
   * Get all payment gateways
   * GET /api/payment-gateways
   */
  getAll: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return sendError(res, 'Company ID is required', 400);
      }

      const gateways = await paymentGatewayService.getAll(companyId);
      return sendSuccess(res, gateways, 'Payment gateways retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve payment gateways', 500);
    }
  },

  /**
   * Get active payment gateways (for clients)
   * GET /api/payment-gateways/active
   */
  getActive: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return sendError(res, 'Company ID is required', 400);
      }

      const gateways = await paymentGatewayService.getActiveGateways(companyId);
      return sendSuccess(res, gateways, 'Active payment gateways retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve active payment gateways', 500);
    }
  },

  /**
   * Get payment gateway by ID
   * GET /api/payment-gateways/:id
   */
  getById: async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = req.user?.companyId;

      if (isNaN(id) || !companyId) {
        return sendError(res, 'Invalid ID or company ID', 400);
      }

      const gateway = await paymentGatewayService.getById(id, companyId);
      return sendSuccess(res, gateway, 'Payment gateway retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve payment gateway', 500);
    }
  },

  /**
   * Create payment gateway
   * POST /api/payment-gateways
   */
  create: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return sendError(res, 'Company ID is required', 400);
      }

      const validatedData = createPaymentGatewaySchema.parse(req.body) as any;
      const gateway = await paymentGatewayService.create({
        ...validatedData,
        companyId,
      });

      return sendSuccess(res, gateway, 'Payment gateway created successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to create payment gateway', 500);
    }
  },

  /**
   * Update payment gateway
   * PUT /api/payment-gateways/:id
   */
  update: async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = req.user?.companyId;

      if (isNaN(id) || !companyId) {
        return sendError(res, 'Invalid ID or company ID', 400);
      }

      const validatedData = updatePaymentGatewaySchema.parse(req.body);
      const gateway = await paymentGatewayService.update(id, companyId, validatedData);

      return sendSuccess(res, gateway, 'Payment gateway updated successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to update payment gateway', 500);
    }
  },

  /**
   * Delete payment gateway
   * DELETE /api/payment-gateways/:id
   */
  delete: async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = req.user?.companyId;

      if (isNaN(id) || !companyId) {
        return sendError(res, 'Invalid ID or company ID', 400);
      }

      await paymentGatewayService.delete(id, companyId);
      return sendSuccess(res, null, 'Payment gateway deleted successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to delete payment gateway', 500);
    }
  },

  /**
   * Get bKash Settings
   * GET /api/payment-gateways/bkash/settings
   */
  getBkashSettings: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) return sendError(res, 'Company ID is required', 400);

      const settings = await prisma.systemSetting.findMany({
        where: {
          companyId,
          key: { startsWith: 'bkash_' }
        }
      });

      const bkashSettings = settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, string>);

      return sendSuccess(res, bkashSettings, 'bKash settings retrieved successfully');
    } catch (error) {
      console.error('Error fetching bkash settings:', error);
      return sendError(res, 'Failed to fetch bKash settings', 500);
    }
  },

  /**
   * Update bKash Settings
   * PUT /api/payment-gateways/bkash/settings
   */
  updateBkashSettings: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) return sendError(res, 'Company ID is required', 400);

      const keys = ['bkash_app_key', 'bkash_app_secret', 'bkash_username', 'bkash_password', 'bkash_is_live', 'bkash_is_active'];

      await prisma.$transaction(
        keys.map(key => {
          const value = req.body[key];
          if (value === undefined) return prisma.systemSetting.findFirst({ where: { id: -1 } }); // No-op

          return prisma.systemSetting.upsert({
            where: {
              companyId_key: { companyId, key }
            },
            update: { value: String(value) },
            create: { companyId, key, value: String(value), description: `bKash setting: ${key}` }
          });
        })
      );

      // Ensure a bKash gateway exists if active
      if (req.body['bkash_is_active'] === 'true') {
        const existing = await prisma.paymentGateway.findFirst({
          where: { companyId, name: { contains: 'bkash' } }
        });
        if (!existing) {
          await prisma.paymentGateway.create({
            data: {
              companyId,
              name: 'bKash (Auto)',
              accountType: 'Payment',
              accountNumber: 'bKash Auto Checkout',
              instructions: 'Pay instantly using your bKash wallet.',
              isActive: true
            }
          });
        }
      } else if (req.body['bkash_is_active'] === 'false') {
        const existing = await prisma.paymentGateway.findFirst({
          where: { companyId, name: { contains: 'bkash' } }
        });
        if (existing) {
          await prisma.paymentGateway.update({
            where: { id: existing.id },
            data: { isActive: false }
          });
        }
      }

      return sendSuccess(res, null, 'bKash settings updated successfully');
    } catch (error) {
      console.error('Error updating bkash settings:', error);
      return sendError(res, 'Failed to update bKash settings', 500);
    }
  },
};

