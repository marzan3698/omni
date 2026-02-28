import { Response } from 'express';
import { leadLabelService } from '../services/leadLabel.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { z } from 'zod';
import { AuthRequest } from '../types/index.js';

const createSchema = z.object({
  name: z.string().min(1, 'Label name is required'),
  color: z.string().max(20).optional(),
  isActive: z.boolean().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().max(20).optional(),
  isActive: z.boolean().optional(),
});

function getCompanyId(req: AuthRequest): number {
  const id = req.user?.companyId;
  if (id) return id;
  return parseInt(process.env.DEFAULT_COMPANY_ID || '1', 10);
}

export const leadLabelController = {
  create: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const validatedData = createSchema.parse(req.body);
      const label = await leadLabelService.create(companyId, validatedData);
      return sendSuccess(res, label, 'Lead label created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create lead label', 400);
    }
  },

  getAll: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const labels = await leadLabelService.getAll(companyId);
      return sendSuccess(res, labels, 'Lead labels retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve lead labels', 500);
    }
  },

  getById: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const id = parseInt(req.params.id);
      const label = await leadLabelService.getById(id, companyId);
      return sendSuccess(res, label, 'Lead label retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve lead label', error.statusCode || 500);
    }
  },

  update: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const id = parseInt(req.params.id);
      const validatedData = updateSchema.parse(req.body);
      const label = await leadLabelService.update(id, companyId, validatedData);
      return sendSuccess(res, label, 'Lead label updated successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update lead label', error.statusCode || 500);
    }
  },

  delete: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const id = parseInt(req.params.id);
      await leadLabelService.delete(id, companyId);
      return sendSuccess(res, null, 'Lead label deleted successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to delete lead label', error.statusCode || 500);
    }
  },
};
