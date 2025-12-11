import { Request, Response } from 'express';
import { campaignService } from '../services/campaign.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { CampaignType } from '@prisma/client';
import { AuthRequest } from '../types/index.js';

// Validation schemas
const createCampaignSchema = z.object({
  companyId: z.number().int().positive(),
  projectId: z.number().int().positive('Project ID is required'),
  name: z.string().min(1, 'Campaign name is required'),
  description: z.string().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  budget: z.number().positive('Budget must be greater than 0'),
  type: z.enum(['reach', 'sale', 'research']),
  productIds: z.array(z.number().int().positive()).optional(),
  groupIds: z.array(z.number().int().positive()).optional(),
});

const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  budget: z.number().positive().optional(),
  type: z.enum(['reach', 'sale', 'research']).optional(),
  productIds: z.array(z.number().int().positive()).optional(),
  projectId: z.number().int().positive().optional(),
  groupIds: z.array(z.number().int().positive()).optional(),
  isActive: z.boolean().optional(),
});

export const campaignController = {
  /**
   * Get all campaigns
   * GET /api/campaigns?companyId=1&type=sale&active=true
   */
  getAllCampaigns: async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      const userRole = (req as AuthRequest).user?.roleName;

      if (!companyId || isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const filters: any = {};
      if (req.query.type) {
        filters.type = req.query.type as CampaignType;
      }
      if (req.query.active !== undefined) {
        filters.active = req.query.active === 'true';
      }

      const campaigns = await campaignService.getAllCampaigns(companyId, filters);
      return sendSuccess(res, campaigns, 'Campaigns retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve campaigns', 500);
    }
  },

  /**
   * Get campaign by ID
   * GET /api/campaigns/:id?companyId=1
   */
  getCampaignById: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string);

      if (isNaN(id) || isNaN(companyId)) {
        return sendError(res, 'Invalid ID', 400);
      }

      const campaign = await campaignService.getCampaignById(id, companyId);
      return sendSuccess(res, campaign, 'Campaign retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve campaign', 500);
    }
  },

  /**
   * Create campaign
   * POST /api/campaigns
   */
  createCampaign: async (req: Request, res: Response) => {
    try {
      const validatedData = createCampaignSchema.parse(req.body);

      // Convert date strings to Date objects if needed
      const campaignData = {
        companyId: validatedData.companyId,
        projectId: validatedData.projectId,
        name: validatedData.name,
        description: validatedData.description,
        startDate: validatedData.startDate instanceof Date
          ? validatedData.startDate
          : new Date(validatedData.startDate),
        endDate: validatedData.endDate instanceof Date
          ? validatedData.endDate
          : new Date(validatedData.endDate),
        budget: validatedData.budget,
        type: validatedData.type,
        productIds: validatedData.productIds,
        groupIds: validatedData.groupIds,
      };

      const campaign = await campaignService.createCampaign(campaignData);
      return sendSuccess(res, campaign, 'Campaign created successfully', 201);
    } catch (error) {
      console.error('Error creating campaign:', error);
      if (error instanceof z.ZodError) {
        console.error('Validation errors:', error.errors);
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to create campaign';
      return sendError(res, errorMessage, 500);
    }
  },

  /**
   * Update campaign
   * PUT /api/campaigns/:id?companyId=1
   */
  updateCampaign: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string || req.body.companyId);

      if (isNaN(id) || isNaN(companyId)) {
        return sendError(res, 'Invalid ID', 400);
      }

      const validatedData = updateCampaignSchema.parse(req.body);

      // Convert date strings to Date objects if needed
      const updateData: any = { ...validatedData };
      if (updateData.startDate && !(updateData.startDate instanceof Date)) {
        updateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate && !(updateData.endDate instanceof Date)) {
        updateData.endDate = new Date(updateData.endDate);
      }
      // Include productIds in updateData if provided
      if (validatedData.productIds !== undefined) {
        updateData.productIds = validatedData.productIds;
      }
      // Include clientIds in updateData if provided
      if (validatedData.clientIds !== undefined) {
        updateData.clientIds = validatedData.clientIds;
      }
      // Include employeeIds in updateData if provided
      if (validatedData.employeeIds !== undefined) {
        updateData.employeeIds = validatedData.employeeIds;
      }
      // Include groupIds in updateData if provided
      if (validatedData.groupIds !== undefined) {
        updateData.groupIds = validatedData.groupIds;
      }

      const campaign = await campaignService.updateCampaign(id, companyId, updateData);
      return sendSuccess(res, campaign, 'Campaign updated successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to update campaign', 500);
    }
  },

  /**
   * Delete campaign
   * DELETE /api/campaigns/:id?companyId=1
   */
  deleteCampaign: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string || req.body.companyId);

      if (isNaN(id) || isNaN(companyId)) {
        return sendError(res, 'Invalid ID', 400);
      }

      await campaignService.deleteCampaign(id, companyId);
      return sendSuccess(res, null, 'Campaign deleted successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to delete campaign', 500);
    }
  },

  /**
   * Get campaign statistics
   * GET /api/campaigns/:id/statistics?companyId=1
   */
  getCampaignStatistics: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string);

      if (isNaN(id) || isNaN(companyId)) {
        return sendError(res, 'Invalid ID', 400);
      }

      const statistics = await campaignService.getCampaignStatistics(id, companyId);
      return sendSuccess(res, statistics, 'Campaign statistics retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve campaign statistics', 500);
    }
  },

  /**
   * Get active campaigns
   * GET /api/campaigns/active?companyId=1
   */
  getActiveCampaigns: async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.query.companyId as string);

      if (!companyId || isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const campaigns = await campaignService.getActiveCampaigns(companyId);
      return sendSuccess(res, campaigns, 'Active campaigns retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve active campaigns', 500);
    }
  },

  /**
   * Get campaign employees
   * GET /api/campaigns/:id/employees?companyId=1
   */
  getCampaignEmployees: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string);

      if (!id || isNaN(id)) {
        return sendError(res, 'Campaign ID is required', 400);
      }

      if (!companyId || isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const employees = await campaignService.getCampaignEmployees(id, companyId);
      return sendSuccess(res, employees, 'Campaign employees retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve campaign employees', 500);
    }
  },

  /**
   * Get campaign products
   * GET /api/campaigns/:id/products?companyId=1
   */
  getCampaignProducts: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string);

      if (!id || isNaN(id)) {
        return sendError(res, 'Campaign ID is required', 400);
      }

      if (!companyId || isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const products = await campaignService.getCampaignProducts(id, companyId);
      return sendSuccess(res, products, 'Campaign products retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve campaign products', 500);
    }
  },

  /**
   * Get campaign clients
   * GET /api/campaigns/:id/clients?companyId=1
   */
  getCampaignClients: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string);

      if (!id || isNaN(id)) {
        return sendError(res, 'Campaign ID is required', 400);
      }

      if (!companyId || isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const clients = await campaignService.getCampaignClients(id, companyId);
      return sendSuccess(res, clients, 'Campaign clients retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve campaign clients', 500);
    }
  },
};

