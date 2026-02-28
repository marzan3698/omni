import { Request, Response } from 'express';
import { leadFormConfigService } from '../services/leadFormConfig.service.js';
import { leadService } from '../services/lead.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { AuthRequest } from '../types/index.js';

const submitSchema = z.object({
  customerName: z.string().min(1, 'Name is required').max(255),
  phone: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.number().int().positive().optional().nullable(),
  interestId: z.number().int().positive().optional().nullable(),
  value: z.number().nonnegative().optional().nullable(),
});

const updateConfigSchema = z.object({
  name: z.string().min(1).optional(),
  fieldConfig: z.any().optional(),
  designConfig: z.any().optional(),
  attributionUserId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const leadFormConfigController = {
  getDefaultPublicConfig: async (req: Request, res: Response) => {
    try {
      const config = await leadFormConfigService.getDefaultPublicConfig();
      if (!config) {
        return sendError(res, 'No lead form available', 404);
      }
      return sendSuccess(res, config, 'Form config retrieved');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to load form config', 500);
    }
  },

  getPublicConfig: async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug as string;
      if (!slug) {
        return sendError(res, 'Form slug is required', 400);
      }
      const config = await leadFormConfigService.getPublicConfig(slug);
      return sendSuccess(res, config, 'Form config retrieved');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to load form config', 500);
    }
  },

  submitLead: async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug as string;
      if (!slug) {
        return sendError(res, 'Form slug is required', 400);
      }
      const parsed = submitSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, parsed.error.errors[0]?.message || 'Invalid input', 400);
      }
      const data = parsed.data;

      const config = await leadFormConfigService.getBySlug(slug);
      const createdBy = await leadFormConfigService.getAttributionUserId(config.companyId, config);

      const title = `Website - ${data.customerName}`;
      const lead = await leadService.createLead({
        companyId: config.companyId,
        createdBy,
        title,
        source: 'Website',
        customerName: data.customerName,
        phone: data.phone || undefined,
        description: data.description || undefined,
        categoryId: data.categoryId || undefined,
        interestId: data.interestId || undefined,
        value: data.value ?? undefined,
      });

      return sendSuccess(res, { id: lead.id }, 'Lead submitted successfully', 201);
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      console.error('Lead form submit error:', error);
      return sendError(res, 'Failed to submit lead', 500);
    }
  },

  getConfig: async (req: Request, res: Response) => {
    try {
      let companyId = (req as AuthRequest).user?.companyId;
      if (!companyId) {
        companyId = parseInt(process.env.DEFAULT_COMPANY_ID || '1', 10);
      }
      const config = await leadFormConfigService.getOrCreate(companyId);
      return sendSuccess(res, config, 'Form config retrieved');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      console.error('Lead form config getConfig error:', error);
      const msg = error instanceof Error ? error.message : 'Failed to load form config';
      return sendError(res, msg, 500);
    }
  },

  updateConfig: async (req: Request, res: Response) => {
    try {
      let companyId = (req as AuthRequest).user?.companyId;
      if (!companyId) {
        companyId = parseInt(process.env.DEFAULT_COMPANY_ID || '1', 10);
      }
      const parsed = updateConfigSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, parsed.error.errors[0]?.message || 'Invalid input', 400);
      }
      const config = await leadFormConfigService.update(companyId, parsed.data);
      return sendSuccess(res, config, 'Form config updated');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to update form config', 500);
    }
  },

  getEmbedCode: async (req: Request, res: Response) => {
    try {
      let companyId = (req as AuthRequest).user?.companyId;
      if (!companyId) {
        companyId = parseInt(process.env.DEFAULT_COMPANY_ID || '1', 10);
      }
      const config = await leadFormConfigService.getOrCreate(companyId);
      const baseUrl = process.env.CLIENT_URL || process.env.API_URL || 'https://imoics.com';
      const embed = leadFormConfigService.getEmbedCode(config.slug, baseUrl);
      return sendSuccess(res, embed, 'Embed code retrieved');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      console.error('Lead form config getEmbedCode error:', error);
      const msg = error instanceof Error ? error.message : 'Failed to get embed code';
      return sendError(res, msg, 500);
    }
  },
};
