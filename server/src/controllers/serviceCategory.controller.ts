import { Request, Response } from 'express';
import { serviceCategoryService } from '../services/serviceCategory.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { AuthRequest } from '../types/index.js';

const createServiceCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(255, 'Category name is too long'),
  parentId: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .optional()
    .nullable()
    .transform((v) => {
      if (v === undefined || v === null || v === '' || v === 'null' || v === 0) return null;
      const n = typeof v === 'string' ? parseInt(v, 10) : v;
      return Number.isNaN(n) || n <= 0 ? null : n;
    }),
  description: z.string().optional(),
  iconName: z.string().max(100).optional(),
  iconUrl: z.string().max(500).optional(),
});

const updateServiceCategorySchema = createServiceCategorySchema.partial();

export const serviceCategoryController = {
  /** Get all categories for client dashboard - uses authenticated user's companyId, no permission required */
  getAllCategoriesForClient: async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const companyId = authReq.user?.companyId;
      if (!companyId) {
        return sendError(res, 'Company ID is required', 400);
      }
      const categories = await serviceCategoryService.getAllCategories(companyId, undefined);
      return sendSuccess(res, categories, 'Service categories retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) return sendError(res, error.message, error.statusCode);
      return sendError(res, 'Failed to retrieve service categories', 500);
    }
  },

  getAllCategories: async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      const parentIdRaw = req.query.parentId;
      let parentIdFilter: number | null | undefined = undefined;
      if (parentIdRaw === 'null' || parentIdRaw === '0' || parentIdRaw === '') {
        parentIdFilter = null; // top-level only
      } else if (parentIdRaw !== undefined && parentIdRaw !== '') {
        const parsed = parseInt(parentIdRaw as string);
        if (!isNaN(parsed)) parentIdFilter = parsed; // children of this parent
      }
      if (!companyId || isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }
      const categories = await serviceCategoryService.getAllCategories(companyId, parentIdFilter);
      return sendSuccess(res, categories, 'Service categories retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) return sendError(res, error.message, error.statusCode);
      return sendError(res, 'Failed to retrieve service categories', 500);
    }
  },

  getCategoryById: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string);
      if (!id || isNaN(id)) return sendError(res, 'Category ID is required', 400);
      if (!companyId || isNaN(companyId)) return sendError(res, 'Company ID is required', 400);
      const category = await serviceCategoryService.getCategoryById(id, companyId);
      return sendSuccess(res, category, 'Service category retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) return sendError(res, error.message, error.statusCode);
      return sendError(res, 'Failed to retrieve service category', 500);
    }
  },

  createCategory: async (req: Request, res: Response) => {
    try {
      const companyId = (req as AuthRequest).user?.companyId;
      if (!companyId) return sendError(res, 'User company ID not found', 400);
      const validatedData = createServiceCategorySchema.parse(req.body);
      const parentId = validatedData.parentId ?? null;
      const category = await serviceCategoryService.createCategory({
        companyId,
        name: validatedData.name,
        parentId: parentId && parentId > 0 ? parentId : null,
        description: validatedData.description,
        iconName: validatedData.iconName,
        iconUrl: validatedData.iconUrl,
      });
      return sendSuccess(res, category, 'Service category created successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) return sendError(res, error.errors[0].message, 400);
      if (error instanceof AppError) return sendError(res, error.message, error.statusCode);
      const msg = error instanceof Error ? error.message : 'Failed to create service category';
      console.error('[serviceCategory create]', error);
      return sendError(res, msg, 500);
    }
  },

  updateCategory: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = (req as AuthRequest).user?.companyId;
      if (!id || isNaN(id)) return sendError(res, 'Category ID is required', 400);
      if (!companyId) return sendError(res, 'User company ID not found', 400);
      const validatedData = updateServiceCategorySchema.parse(req.body);
      const category = await serviceCategoryService.updateCategory(id, validatedData, companyId);
      return sendSuccess(res, category, 'Service category updated successfully');
    } catch (error) {
      if (error instanceof z.ZodError) return sendError(res, error.errors[0].message, 400);
      if (error instanceof AppError) return sendError(res, error.message, error.statusCode);
      return sendError(res, 'Failed to update service category', 500);
    }
  },

  deleteCategory: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = (req as AuthRequest).user?.companyId;
      if (!id || isNaN(id)) return sendError(res, 'Category ID is required', 400);
      if (!companyId) return sendError(res, 'User company ID not found', 400);
      await serviceCategoryService.deleteCategory(id, companyId);
      return sendSuccess(res, null, 'Service category deleted successfully');
    } catch (error) {
      if (error instanceof AppError) return sendError(res, error.message, error.statusCode);
      return sendError(res, 'Failed to delete service category', 500);
    }
  },

  uploadIcon: async (req: Request, res: Response) => {
    try {
      if (!req.file) return sendError(res, 'No icon file provided', 400);
      const id = parseInt(req.params.id);
      const companyId = (req as AuthRequest).user?.companyId;
      if (!id || isNaN(id)) return sendError(res, 'Category ID is required', 400);
      if (!companyId) return sendError(res, 'User company ID not found', 400);
      const iconUrl = `/uploads/service-categories/${req.file.filename}`;
      const category = await serviceCategoryService.updateCategory(
        id,
        { iconUrl, iconName: null },
        companyId
      );
      return sendSuccess(res, category, 'Icon uploaded successfully', 200);
    } catch (error) {
      if (error instanceof AppError) return sendError(res, error.message, error.statusCode);
      return sendError(res, 'Failed to upload icon', 500);
    }
  },
};
