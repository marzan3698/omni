import { Request, Response } from 'express';
import { productCategoryService } from '../services/productCategory.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { AuthRequest } from '../types/index.js';

// Validation schemas
const createProductCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(255, 'Category name is too long'),
  description: z.string().optional(),
});

const updateProductCategorySchema = createProductCategorySchema.partial();

export const productCategoryController = {
  /**
   * Get all product categories
   * GET /api/product-categories?companyId=1
   */
  getAllCategories: async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.query.companyId as string);

      if (!companyId || isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const categories = await productCategoryService.getAllCategories(companyId);
      return sendSuccess(res, categories, 'Product categories retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve product categories', 500);
    }
  },

  /**
   * Get product category by ID
   * GET /api/product-categories/:id?companyId=1
   */
  getCategoryById: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string);

      if (!id || isNaN(id)) {
        return sendError(res, 'Category ID is required', 400);
      }

      if (!companyId || isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const category = await productCategoryService.getCategoryById(id, companyId);
      return sendSuccess(res, category, 'Product category retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve product category', 500);
    }
  },

  /**
   * Create product category
   * POST /api/product-categories
   */
  createCategory: async (req: Request, res: Response) => {
    try {
      const companyId = (req as AuthRequest).user?.companyId;
      if (!companyId) {
        return sendError(res, 'User company ID not found', 400);
      }

      const validatedData = createProductCategorySchema.parse(req.body);
      const category = await productCategoryService.createCategory({
        ...validatedData,
        companyId,
      });

      return sendSuccess(res, category, 'Product category created successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to create product category', 500);
    }
  },

  /**
   * Update product category
   * PUT /api/product-categories/:id?companyId=1
   */
  updateCategory: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = (req as AuthRequest).user?.companyId;

      if (!id || isNaN(id)) {
        return sendError(res, 'Category ID is required', 400);
      }

      if (!companyId) {
        return sendError(res, 'User company ID not found', 400);
      }

      const validatedData = updateProductCategorySchema.parse(req.body);
      const category = await productCategoryService.updateCategory(id, validatedData, companyId);

      return sendSuccess(res, category, 'Product category updated successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to update product category', 500);
    }
  },

  /**
   * Delete product category
   * DELETE /api/product-categories/:id?companyId=1
   */
  deleteCategory: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = (req as AuthRequest).user?.companyId;

      if (!id || isNaN(id)) {
        return sendError(res, 'Category ID is required', 400);
      }

      if (!companyId) {
        return sendError(res, 'User company ID not found', 400);
      }

      await productCategoryService.deleteCategory(id, companyId);
      return sendSuccess(res, null, 'Product category deleted successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to delete product category', 500);
    }
  },
};

