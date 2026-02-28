import { Response } from 'express';
import { leadPriorityService } from '../services/leadPriority.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { z } from 'zod';
import { AuthRequest } from '../types/index.js';

const createSchema = z.object({
  name: z.string().min(1, 'Priority name is required').transform((s) => s?.trim() || ''),
  sortOrder: z.coerce.number().int().optional().default(0),
  isActive: z.boolean().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

function getCompanyId(req: AuthRequest): number {
  const id = req.user?.companyId;
  if (id) return id;
  return parseInt(process.env.DEFAULT_COMPANY_ID || '1', 10);
}

export const leadPriorityController = {
  create: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const validatedData = createSchema.parse(req.body);
      const priority = await leadPriorityService.create(companyId, validatedData);
      return sendSuccess(res, priority, 'Lead priority created successfully', 201);
    } catch (error: any) {
      if (error?.name === 'ZodError' && error?.errors?.[0]) {
        return sendError(res, error.errors[0].message || 'Invalid input', 400);
      }
      return sendError(res, error?.message || 'Failed to create lead priority', 400);
    }
  },

  getAll: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const priorities = await leadPriorityService.getAll(companyId);
      return sendSuccess(res, priorities, 'Lead priorities retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve lead priorities', 500);
    }
  },

  getById: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const id = parseInt(req.params.id);
      const priority = await leadPriorityService.getById(id, companyId);
      return sendSuccess(res, priority, 'Lead priority retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve lead priority', error.statusCode || 500);
    }
  },

  update: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const id = parseInt(req.params.id);
      const validatedData = updateSchema.parse(req.body);
      const priority = await leadPriorityService.update(id, companyId, validatedData);
      return sendSuccess(res, priority, 'Lead priority updated successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update lead priority', error.statusCode || 500);
    }
  },

  delete: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const id = parseInt(req.params.id);
      await leadPriorityService.delete(id, companyId);
      return sendSuccess(res, null, 'Lead priority deleted successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to delete lead priority', error.statusCode || 500);
    }
  },
};
