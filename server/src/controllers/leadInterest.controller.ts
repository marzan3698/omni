import { Response } from 'express';
import { leadInterestService } from '../services/leadInterest.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { z } from 'zod';
import { AuthRequest } from '../types/index.js';

const createInterestSchema = z.object({
  name: z.string().min(1, 'Interest name is required'),
  isActive: z.boolean().optional(),
});

const updateInterestSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const leadInterestController = {
  createInterest: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      const validatedData = createInterestSchema.parse(req.body);
      const interest = await leadInterestService.createInterest(companyId, validatedData);
      return sendSuccess(res, interest, 'Lead interest created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create lead interest', 400);
    }
  },

  getInterests: async (req: AuthRequest, res: Response) => {
    try {
      // Get all interests (no company filtering needed)
      const interests = await leadInterestService.getAllInterests();
      return sendSuccess(res, interests, 'Lead interests retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve lead interests', 500);
    }
  },

  getInterestById: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      const id = parseInt(req.params.id);
      const interest = await leadInterestService.getInterestById(id, companyId);
      return sendSuccess(res, interest, 'Lead interest retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve lead interest', error.statusCode || 500);
    }
  },

  updateInterest: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      const id = parseInt(req.params.id);
      const validatedData = updateInterestSchema.parse(req.body);
      const interest = await leadInterestService.updateInterest(id, companyId, validatedData);
      return sendSuccess(res, interest, 'Lead interest updated successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update lead interest', error.statusCode || 500);
    }
  },

  deleteInterest: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      const id = parseInt(req.params.id);
      await leadInterestService.deleteInterest(id, companyId);
      return sendSuccess(res, null, 'Lead interest deleted successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to delete lead interest', error.statusCode || 500);
    }
  },
};

