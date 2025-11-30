import { Response } from 'express';
import { leadCategoryService } from '../services/leadCategory.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { z } from 'zod';
import { AuthRequest } from '../types/index.js';

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  isActive: z.boolean().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const leadCategoryController = {
  createCategory: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      const validatedData = createCategorySchema.parse(req.body);
      const category = await leadCategoryService.createCategory(companyId, validatedData);
      return sendSuccess(res, category, 'Lead category created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create lead category', 400);
    }
  },

  getCategories: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      const categories = await leadCategoryService.getCategories(companyId);
      return sendSuccess(res, categories, 'Lead categories retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve lead categories', 500);
    }
  },

  getCategoryById: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      const id = parseInt(req.params.id);
      const category = await leadCategoryService.getCategoryById(id, companyId);
      return sendSuccess(res, category, 'Lead category retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve lead category', error.statusCode || 500);
    }
  },

  updateCategory: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      const id = parseInt(req.params.id);
      const validatedData = updateCategorySchema.parse(req.body);
      const category = await leadCategoryService.updateCategory(id, companyId, validatedData);
      return sendSuccess(res, category, 'Lead category updated successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update lead category', error.statusCode || 500);
    }
  },

  deleteCategory: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      const id = parseInt(req.params.id);
      await leadCategoryService.deleteCategory(id, companyId);
      return sendSuccess(res, null, 'Lead category deleted successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to delete lead category', error.statusCode || 500);
    }
  },
};

