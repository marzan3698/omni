import { Request, Response, NextFunction } from 'express';
import { integrationService } from '../services/integration.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';

// Validation schemas
const createIntegrationSchema = z.object({
  provider: z.enum(['facebook', 'whatsapp']),
  pageId: z.string().min(1, 'Page ID is required'),
  accessToken: z.string().min(1, 'Access token is required'),
  accountId: z.string().optional(),
  baseUrl: z.string().optional(),
  isActive: z.boolean().optional(),
  webhookMode: z.enum(['local', 'live']).optional(),
  isWebhookActive: z.boolean().optional(),
});

const updateIntegrationSchema = z.object({
  pageId: z.string().min(1).optional(),
  accessToken: z.string().min(1).optional(),
  accountId: z.string().optional(),
  baseUrl: z.string().optional(),
  isActive: z.boolean().optional(),
  webhookMode: z.enum(['local', 'live']).optional(),
  isWebhookActive: z.boolean().optional(),
});

export const integrationController = {
  /**
   * Create or update an integration
   * POST /api/integrations
   */
  upsertIntegration: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createIntegrationSchema.parse(req.body);
      const companyId = (req as any).user?.companyId;
      if (!companyId) {
        return sendError(res, 'User company ID not found', 400);
      }
      const integration = await integrationService.upsertIntegration({
        ...validatedData,
        companyId,
      } as any);
      sendSuccess(res, integration, 'Integration saved successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * Get all integrations
   * GET /api/integrations
   */
  getIntegrations: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const integrations = await integrationService.getIntegrations();
      sendSuccess(res, integrations, 'Integrations retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get integration by ID
   * GET /api/integrations/:id
   */
  getIntegrationById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return sendError(res, 'Invalid integration ID', 400);
      }

      const integration = await integrationService.getIntegrationById(id);
      sendSuccess(res, integration, 'Integration retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * Update integration
   * PUT /api/integrations/:id
   */
  updateIntegration: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return sendError(res, 'Invalid integration ID', 400);
      }

      const validatedData = updateIntegrationSchema.parse(req.body);
      const integration = await integrationService.updateIntegration(id, validatedData);
      sendSuccess(res, integration, 'Integration updated successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * Delete integration
   * DELETE /api/integrations/:id
   */
  deleteIntegration: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return sendError(res, 'Invalid integration ID', 400);
      }

      await integrationService.deleteIntegration(id);
      sendSuccess(res, null, 'Integration deleted successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  },
};

