import { Request, Response } from 'express';
import { serviceService } from '../services/service.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../types/index.js';
import { z } from 'zod';
import { singleServiceThumbnail, multipleServiceGallery } from '../middleware/upload.js';

// Validation schemas
const createServiceSchema = z.object({
  categoryId: z.number().int().positive('Category is required'),
  title: z.string().min(1, 'Title is required'),
  shortDescription: z.string().optional(),
  details: z.string().min(1, 'Details are required'),
  priceType: z.enum(['ONE_TIME', 'RENEWAL']).default('ONE_TIME'),
  pricing: z.number().positive('Pricing must be greater than 0'),
  renewalInterval: z.enum(['MONTHLY', 'SIX_MONTH', 'YEARLY']).nullable().optional(),
  thumbnailType: z.enum(['IMAGE', 'YOUTUBE', 'LOCAL_VIDEO']).default('IMAGE'),
  thumbnailUrl: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  currency: z.enum(['BDT', 'USD']).default('BDT'),
  attributes: z.object({
    keyValuePairs: z.record(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
  isActive: z.boolean().default(true),
});

const updateServiceSchema = z.object({
  categoryId: z.number().int().positive().optional(),
  title: z.string().min(1).optional(),
  shortDescription: z.string().optional(),
  details: z.string().min(1).optional(),
  priceType: z.enum(['ONE_TIME', 'RENEWAL']).optional(),
  pricing: z.number().positive().optional(),
  renewalInterval: z.enum(['MONTHLY', 'SIX_MONTH', 'YEARLY']).nullable().optional(),
  thumbnailType: z.enum(['IMAGE', 'YOUTUBE', 'LOCAL_VIDEO']).optional(),
  thumbnailUrl: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  currency: z.enum(['BDT', 'USD']).optional(),
  attributes: z.object({
    keyValuePairs: z.record(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
  isActive: z.boolean().optional(),
});

export const serviceController = {
  /**
   * Create a new service
   * POST /api/services
   */
  /**
   * Create a new service
   */
  createService: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) return sendError(res, 'Company ID is required', 400);

      const validatedData = createServiceSchema.parse(req.body);

      const service = await serviceService.createService({
        ...validatedData as any,
        companyId,
        attributes: (validatedData.attributes as any) || { keyValuePairs: {}, tags: [] },
      });

      return sendSuccess(res, service, 'Service created successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) return sendError(res, error.errors[0].message, 400);
      if (error instanceof AppError) return sendError(res, error.message, error.statusCode);
      console.error('Create service error:', error);
      return sendError(res, 'Failed to create service', 500);
    }
  },

  /**
   * Get all services
   */
  getAllServices: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) return sendError(res, 'Company ID is required', 400);

      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      const services = await serviceService.getAllServices(companyId, { isActive });

      return sendSuccess(res, services, 'Services retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) return sendError(res, error.message, error.statusCode);
      return sendError(res, 'Failed to retrieve services', 500);
    }
  },

  /**
   * Get service by ID
   */
  getServiceById: async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = req.user?.companyId;

      if (isNaN(id)) return sendError(res, 'Invalid service ID', 400);
      if (!companyId) return sendError(res, 'Company ID is required', 400);

      const service = await serviceService.getServiceById(id, companyId);
      return sendSuccess(res, service, 'Service retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) return sendError(res, error.message, error.statusCode);
      return sendError(res, 'Failed to retrieve service', 500);
    }
  },

  /**
   * Update service
   */
  updateService: async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = req.user?.companyId;

      if (isNaN(id)) return sendError(res, 'Invalid service ID', 400);
      if (!companyId) return sendError(res, 'Company ID is required', 400);

      const validatedData = updateServiceSchema.parse(req.body);
      const service = await serviceService.updateService(id, companyId, validatedData);

      return sendSuccess(res, service, 'Service updated successfully');
    } catch (error) {
      if (error instanceof z.ZodError) return sendError(res, error.errors[0].message, 400);
      if (error instanceof AppError) return sendError(res, error.message, error.statusCode);
      return sendError(res, 'Failed to update service', 500);
    }
  },

  /**
   * Delete service
   */
  deleteService: async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = req.user?.companyId;

      if (isNaN(id)) return sendError(res, 'Invalid service ID', 400);
      if (!companyId) return sendError(res, 'Company ID is required', 400);

      await serviceService.deleteService(id, companyId);
      return sendSuccess(res, null, 'Service deleted successfully');
    } catch (error) {
      if (error instanceof AppError) return sendError(res, error.message, error.statusCode);
      return sendError(res, 'Failed to delete service', 500);
    }
  },

  /**
   * Upload service thumbnail
   */
  uploadThumbnail: async (req: AuthRequest, res: Response) => {
    return new Promise<void>((resolve, reject) => {
      singleServiceThumbnail(req, res, (err: any) => {
        if (err) {
          console.error('Thumbnail upload error:', err);
          return sendError(res, err.message || 'Thumbnail upload failed', 400);
        }

        if (!req.file) {
          return sendError(res, 'No thumbnail file provided', 400);
        }

        const thumbnailUrl = `/uploads/services/${req.file.filename}`;
        sendSuccess(res, { thumbnailUrl }, 'Thumbnail uploaded successfully', 201);
        resolve();
      });
    });
  },

  /**
   * Upload service gallery images
   */
  uploadGallery: async (req: AuthRequest, res: Response) => {
    return new Promise<void>((resolve, reject) => {
      multipleServiceGallery(req, res, (err: any) => {
        if (err) {
          console.error('Gallery upload error:', err);
          return sendError(res, err.message || 'Gallery upload failed', 400);
        }

        if (!req.files || !(req.files as any[]).length) {
          return sendError(res, 'No gallery images provided', 400);
        }

        const gallery = (req.files as Express.Multer.File[]).map(file => `/uploads/services/${file.filename}`);
        sendSuccess(res, { gallery }, 'Gallery images uploaded successfully', 201);
        resolve();
      });
    });
  },
};

