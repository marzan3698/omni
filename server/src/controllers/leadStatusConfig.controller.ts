import { Response } from 'express';
import { leadStatusConfigService } from '../services/leadStatusConfig.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { z } from 'zod';
import { AuthRequest } from '../types/index.js';

const createSchema = z.object({
  name: z.string().min(1, 'Status name is required'),
  code: z.string().min(1).max(30).regex(/^[A-Za-z0-9_]+$/, 'Code must be alphanumeric'),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).max(30).regex(/^[A-Za-z0-9_]+$/).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

function getCompanyId(req: AuthRequest): number {
  const id = req.user?.companyId;
  if (id) return id;
  return parseInt(process.env.DEFAULT_COMPANY_ID || '1', 10);
}

export const leadStatusConfigController = {
  create: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const validatedData = createSchema.parse(req.body);
      const status = await leadStatusConfigService.create(companyId, validatedData);
      return sendSuccess(res, status, 'Lead status created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create lead status', 400);
    }
  },

  getAll: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const statuses = await leadStatusConfigService.getAll(companyId);
      return sendSuccess(res, statuses, 'Lead statuses retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve lead statuses', 500);
    }
  },

  getById: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const id = parseInt(req.params.id);
      const status = await leadStatusConfigService.getById(id, companyId);
      return sendSuccess(res, status, 'Lead status retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve lead status', error.statusCode || 500);
    }
  },

  update: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const id = parseInt(req.params.id);
      const validatedData = updateSchema.parse(req.body);
      const status = await leadStatusConfigService.update(id, companyId, validatedData);
      return sendSuccess(res, status, 'Lead status updated successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update lead status', error.statusCode || 500);
    }
  },

  delete: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const id = parseInt(req.params.id);
      await leadStatusConfigService.delete(id, companyId);
      return sendSuccess(res, null, 'Lead status deleted successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to delete lead status', error.statusCode || 500);
    }
  },
};
