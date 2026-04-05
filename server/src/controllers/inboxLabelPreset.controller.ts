import { Request, Response } from 'express';
import { inboxLabelPresetService } from '../services/inboxLabelPreset.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import { z } from 'zod';

const inboxLabelPresetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  color: z.string().max(20).optional().nullable(),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const inboxLabelPresetController = {
  /**
   * Get all presets for the company
   */
  async getAll(req: Request, res: Response) {
    try {
      const companyId = (req as AuthRequest).user?.companyId;
      if (!companyId) return sendError(res, 'Unauthorized', 401);

      const presets = await inboxLabelPresetService.getAll(companyId);
      return sendSuccess(res, presets, 'Inbox labels retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve inbox labels');
    }
  },

  /**
   * Create a new preset
   */
  async create(req: Request, res: Response) {
    try {
      const companyId = (req as AuthRequest).user?.companyId;
      if (!companyId) return sendError(res, 'Unauthorized', 401);

      const validatedData = inboxLabelPresetSchema.parse(req.body);
      const preset = await inboxLabelPresetService.create({
        companyId,
        name: validatedData.name,
        color: validatedData.color ?? undefined,
        description: validatedData.description ?? undefined,
        sortOrder: validatedData.sortOrder,
        isActive: validatedData.isActive,
      });

      return sendSuccess(res, preset, 'Inbox label created successfully', 201);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      return sendError(res, error.message || 'Failed to create inbox label');
    }
  },

  /**
   * Update an existing preset
   */
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const companyId = (req as AuthRequest).user?.companyId;
      if (!companyId) return sendError(res, 'Unauthorized', 401);
      if (isNaN(id)) return sendError(res, 'Invalid ID', 400);

      const validatedData = inboxLabelPresetSchema.partial().parse(req.body);
      const preset = await inboxLabelPresetService.update(id, companyId, validatedData);

      return sendSuccess(res, preset, 'Inbox label updated successfully');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      return sendError(res, error.message || 'Failed to update inbox label');
    }
  },

  /**
   * Delete a preset
   */
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const companyId = (req as AuthRequest).user?.companyId;
      if (!companyId) return sendError(res, 'Unauthorized', 401);
      if (isNaN(id)) return sendError(res, 'Invalid ID', 400);

      await inboxLabelPresetService.delete(id, companyId);
      return sendSuccess(res, null, 'Inbox label deleted successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to delete inbox label');
    }
  },
};
