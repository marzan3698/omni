import { Request, Response } from 'express';
import { productService } from '../services/product.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { Currency } from '@prisma/client';
import { AuthRequest } from '../types/index.js';
import { singleProductImage } from '../middleware/upload.js';
import path from 'path';

// Validation schemas
const createProductSchema = z.object({
  categoryId: z.number().int().positive('Category ID is required'),
  name: z.string().min(1, 'Product name is required').max(255, 'Product name is too long'),
  description: z.string().optional(),
  purchasePrice: z.number().positive('Purchase price must be greater than 0'),
  salePrice: z.number().positive('Sale price must be greater than 0'),
  currency: z.enum(['BDT', 'USD'], { errorMap: () => ({ message: 'Currency must be BDT or USD' }) }),
  productCompany: z.string().optional(),
  imageUrl: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === '') return true;
        // Accept absolute URLs
        try {
          new URL(val);
          return true;
        } catch {
          // Accept relative paths starting with /
          return val.startsWith('/');
        }
      },
      { message: 'Invalid URL format' }
    ),
  quickReplies: z
    .array(
      z.object({
        type: z.enum(['attribute', 'sales']),
        key: z.string().optional(),
        value: z.string().min(1, 'Value is required'),
      })
    )
    .optional(),
  leadPoint: z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => (v === '' || v === undefined || v === null ? undefined : Number(v)))
    .refine((v) => v === undefined || (!Number.isNaN(v) && v >= 0), 'Lead point must be a non-negative number'),
  customerPoint: z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => (v === '' || v === undefined || v === null ? undefined : Number(v)))
    .refine((v) => v === undefined || (!Number.isNaN(v) && v >= 0), 'Customer point must be a non-negative number'),
});

const updateProductSchema = createProductSchema.partial();

export const productController = {
  /**
   * Get all products
   * GET /api/products?companyId=1&categoryId=1&search=keyword
   */
  getAllProducts: async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const search = req.query.search as string | undefined;

      if (!companyId || isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const filters: any = {};
      if (categoryId) filters.categoryId = categoryId;
      if (search) filters.search = search;

      const products = await productService.getAllProducts(companyId, filters);
      return sendSuccess(res, products, 'Products retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve products', 500);
    }
  },

  /**
   * Get product by ID
   * GET /api/products/:id?companyId=1
   */
  getProductById: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string);

      if (!id || isNaN(id)) {
        return sendError(res, 'Product ID is required', 400);
      }

      if (!companyId || isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const product = await productService.getProductById(id, companyId);
      return sendSuccess(res, product, 'Product retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve product', 500);
    }
  },

  /**
   * Create product
   * POST /api/products
   */
  createProduct: async (req: Request, res: Response) => {
    try {
      const companyId = (req as AuthRequest).user?.companyId;
      if (!companyId) {
        return sendError(res, 'User company ID not found', 400);
      }

      const validatedData = createProductSchema.parse(req.body);
      
      // Clean up imageUrl - convert empty string to undefined
      const cleanData = {
        ...validatedData,
        imageUrl: validatedData.imageUrl && validatedData.imageUrl.trim() !== '' 
          ? validatedData.imageUrl 
          : undefined,
        companyId,
      };
      
      const product = await productService.createProduct(cleanData);

      return sendSuccess(res, product, 'Product created successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      console.error('Product create error:', error);
      const message = error instanceof Error ? error.message : 'Failed to create product';
      return sendError(res, message, 500);
    }
  },

  /**
   * Update product
   * PUT /api/products/:id?companyId=1
   */
  updateProduct: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = (req as AuthRequest).user?.companyId;

      if (!id || isNaN(id)) {
        return sendError(res, 'Product ID is required', 400);
      }

      if (!companyId) {
        return sendError(res, 'User company ID not found', 400);
      }

      const validatedData = updateProductSchema.parse(req.body);
      
      // Clean up imageUrl - convert empty string to undefined
      const cleanData: any = { ...validatedData };
      if (cleanData.imageUrl !== undefined) {
        cleanData.imageUrl = cleanData.imageUrl && cleanData.imageUrl.trim() !== '' 
          ? cleanData.imageUrl 
          : undefined;
      }
      
      const product = await productService.updateProduct(id, cleanData, companyId);

      return sendSuccess(res, product, 'Product updated successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      console.error('Product update error:', error);
      const message = error instanceof Error ? error.message : 'Failed to update product';
      return sendError(res, message, 500);
    }
  },

  /**
   * Delete product
   * DELETE /api/products/:id?companyId=1
   */
  deleteProduct: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = (req as AuthRequest).user?.companyId;

      if (!id || isNaN(id)) {
        return sendError(res, 'Product ID is required', 400);
      }

      if (!companyId) {
        return sendError(res, 'User company ID not found', 400);
      }

      await productService.deleteProduct(id, companyId);
      return sendSuccess(res, null, 'Product deleted successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to delete product', 500);
    }
  },

  /**
   * Upload product image
   * POST /api/products/upload-image
   */
  uploadImage: async (req: Request, res: Response) => {
    return new Promise<void>((resolve, reject) => {
      singleProductImage(req, res, (err: any) => {
        if (err) {
          return sendError(res, err.message || 'Image upload failed', 400);
        }

        if (!req.file) {
          return sendError(res, 'No image file provided', 400);
        }

        // Return the image URL
        const imageUrl = `/uploads/products/${req.file.filename}`;
        sendSuccess(res, { imageUrl }, 'Image uploaded successfully', 201);
        resolve();
      });
    });
  },
};

