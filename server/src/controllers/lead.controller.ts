import { Request, Response } from 'express';
import { leadService } from '../services/lead.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { LeadSource, LeadStatus } from '@prisma/client';
import { AuthRequest } from '../types/index.js';

// Validation schemas
const createLeadSchema = z.object({
  companyId: z.number().int().positive(),
  title: z.string().min(1, 'Lead title is required'),
  description: z.string().optional(),
  source: z.enum(['Website', 'Referral', 'SocialMedia', 'Email', 'Phone', 'Inbox', 'Other']),
  status: z.enum(['New', 'Contacted', 'Qualified', 'Negotiation', 'Won', 'Lost']).optional(),
  assignedTo: z.array(z.number().int().positive()).optional(),
  value: z.number().positive().optional(),
  conversationId: z.number().int().positive().optional(),
  campaignId: z.number().int().positive().optional(),
});

// IMPORTANT:
// - Lead status can only be changed via PUT /:id/status by Lead Manager.
// - Prevent status changes via the generic PUT /:id endpoint.
const updateLeadSchema = createLeadSchema.partial().omit({
  status: true,
  companyId: true,
});

const createLeadFromInboxSchema = z.object({
  title: z.string().min(1, 'Lead title is required'),
  description: z.string().optional(),
  assignedTo: z.array(z.number().int().positive()).optional(),
  value: z.number().positive().optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  phone: z.string().min(1, 'Phone is required'),
  categoryId: z.number().int().positive().optional(), // Now optional
  interestId: z.number().int().positive().optional(), // Now optional
  campaignId: z.number().int().positive().optional(), // Now optional
  productId: z.number().int().positive().optional(),
  purchasePrice: z.number().nonnegative().optional(),
  salePrice: z.number().nonnegative().optional(),
  profit: z.number().optional(),
});

const convertLeadSchema = z.object({
  name: z.string().min(1).optional(),
  contactInfo: z.any().optional(),
  address: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const transferLeadMonitoringSchema = z.object({
  newLeadManagerUserId: z.string().uuid('Invalid Lead Manager user ID'),
});

export const leadController = {
  /**
   * Get all leads
   * GET /api/leads?companyId=1&status=New&source=Inbox
   */
  getAllLeads: async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthRequest).user?.id;
      const userRole = (req as AuthRequest).user?.role?.name;

      const filters: any = {};
      
      // If not Lead Manager or SuperAdmin, show leads created by this user OR assigned to this user
      if (userRole !== 'Lead Manager' && userRole !== 'SuperAdmin') {
        if (!userId) {
          return sendError(res, 'User ID not found', 400);
        }
        filters.createdByOrAssignedToUserId = userId;
      }
      
      // Apply filters
      if (req.query.status) filters.status = req.query.status as LeadStatus;
      if (req.query.source) filters.source = req.query.source as LeadSource;
      if (req.query.assignedTo) filters.assignedTo = parseInt(req.query.assignedTo as string);
      if (req.query.categoryId) filters.categoryId = parseInt(req.query.categoryId as string);
      if (req.query.interestId) filters.interestId = parseInt(req.query.interestId as string);
      if (req.query.search) filters.search = req.query.search as string;
      if (req.query.createdBy) filters.createdBy = req.query.createdBy as string;
      // convertedOnly: 'true' = only leads converted to client (Complete tab); otherwise exclude them (All Leads tab)
      if (req.query.convertedOnly === 'true') {
        filters.convertedOnly = true;
      } else {
        filters.convertedOnly = false;
      }

      const leads = await leadService.getAllLeads(filters);
      return sendSuccess(res, leads, 'Leads retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve leads', 500);
    }
  },

  /**
   * Get lead by ID
   * GET /api/leads/:id
   */
  getLeadById: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string || req.body.companyId);
      
      if (isNaN(id) || isNaN(companyId)) {
        return sendError(res, 'Invalid ID', 400);
      }

      const lead = await leadService.getLeadById(id, companyId);
      return sendSuccess(res, lead, 'Lead retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve lead', 500);
    }
  },

  /**
   * Create lead from inbox
   * POST /api/leads/from-inbox/:conversationId
   */
  createLeadFromInbox: async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.conversationId);
      const userId = (req as AuthRequest).user?.id;
      
      if (isNaN(conversationId)) {
        return sendError(res, 'Invalid conversation ID', 400);
      }

      if (!userId) {
        return sendError(res, 'User ID not found', 400);
      }

      // Convert string numbers to actual numbers, handle empty strings
      const body: any = { ...req.body };
      
      // Category is now optional
      if (body.categoryId !== undefined && body.categoryId !== null && body.categoryId !== '') {
        body.categoryId = typeof body.categoryId === 'string' ? parseInt(body.categoryId, 10) : body.categoryId;
        if (isNaN(body.categoryId) || body.categoryId <= 0) {
          body.categoryId = undefined;
        }
      } else {
        body.categoryId = undefined;
      }
      
      // Interest is now optional
      if (body.interestId !== undefined && body.interestId !== null && body.interestId !== '') {
        body.interestId = typeof body.interestId === 'string' ? parseInt(body.interestId, 10) : body.interestId;
        if (isNaN(body.interestId) || body.interestId <= 0) {
          body.interestId = undefined;
        }
      } else {
        body.interestId = undefined;
      }
      
      // Campaign is now optional
      if (body.campaignId !== undefined && body.campaignId !== null && body.campaignId !== '') {
        body.campaignId = typeof body.campaignId === 'string' ? parseInt(body.campaignId, 10) : body.campaignId;
        if (isNaN(body.campaignId) || body.campaignId <= 0) {
          body.campaignId = undefined;
        }
      } else {
        body.campaignId = undefined;
      }
      
      if (body.assignedTo !== undefined && body.assignedTo !== null && body.assignedTo !== '') {
        body.assignedTo = typeof body.assignedTo === 'string' ? parseInt(body.assignedTo, 10) : body.assignedTo;
        if (isNaN(body.assignedTo) || body.assignedTo <= 0) {
          body.assignedTo = undefined;
        }
      } else {
        body.assignedTo = undefined;
      }
      
      if (body.value !== undefined && body.value !== null && body.value !== '') {
        body.value = typeof body.value === 'string' ? parseFloat(body.value) : body.value;
        if (isNaN(body.value) || body.value <= 0) {
          body.value = undefined;
        }
      } else {
        body.value = undefined;
      }

      // Handle new pricing fields
      if (body.productId !== undefined && body.productId !== null && body.productId !== '') {
        body.productId = typeof body.productId === 'string' ? parseInt(body.productId, 10) : body.productId;
        if (isNaN(body.productId) || body.productId <= 0) {
          body.productId = undefined;
        }
      } else {
        body.productId = undefined;
      }

      if (body.purchasePrice !== undefined && body.purchasePrice !== null && body.purchasePrice !== '') {
        body.purchasePrice = typeof body.purchasePrice === 'string' ? parseFloat(body.purchasePrice) : body.purchasePrice;
        if (isNaN(body.purchasePrice) || body.purchasePrice < 0) {
          body.purchasePrice = undefined;
        }
      } else {
        body.purchasePrice = undefined;
      }

      if (body.salePrice !== undefined && body.salePrice !== null && body.salePrice !== '') {
        body.salePrice = typeof body.salePrice === 'string' ? parseFloat(body.salePrice) : body.salePrice;
        if (isNaN(body.salePrice) || body.salePrice < 0) {
          body.salePrice = undefined;
        }
      } else {
        body.salePrice = undefined;
      }

      if (body.profit !== undefined && body.profit !== null && body.profit !== '') {
        body.profit = typeof body.profit === 'string' ? parseFloat(body.profit) : body.profit;
        if (isNaN(body.profit)) {
          body.profit = undefined;
        }
      } else {
        body.profit = undefined;
      }

      const validatedData = createLeadFromInboxSchema.parse(body);
      console.log('Validated data:', JSON.stringify(validatedData, null, 2));

      const lead = await leadService.createLeadFromInbox(conversationId, userId, {
        title: validatedData.title,
        description: validatedData.description,
        assignedTo: validatedData.assignedTo,
        value: validatedData.value,
        customerName: validatedData.customerName,
        phone: validatedData.phone,
        categoryId: validatedData.categoryId,
        interestId: validatedData.interestId,
        campaignId: validatedData.campaignId,
        productId: validatedData.productId,
        purchasePrice: validatedData.purchasePrice,
        salePrice: validatedData.salePrice,
        profit: validatedData.profit,
      });
      return sendSuccess(res, lead, 'Lead created from inbox successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', JSON.stringify(error.errors, null, 2));
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        console.error('AppError:', error.message, error.statusCode);
        return sendError(res, error.message, error.statusCode);
      }
      console.error('Error creating lead from inbox:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
        return sendError(res, `Failed to create lead: ${error.message}`, 500);
      }
      return sendError(res, 'Failed to create lead from inbox', 500);
    }
  },

  /**
   * Create lead
   * POST /api/leads
   */
  createLead: async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthRequest).user?.id;
      if (!userId) {
        return sendError(res, 'User ID not found', 400);
      }
      const validatedData = createLeadSchema.parse(req.body);
      const lead = await leadService.createLead({
        companyId: validatedData.companyId,
        createdBy: userId,
        title: validatedData.title,
        description: validatedData.description,
        source: validatedData.source,
        status: validatedData.status,
        assignedTo: validatedData.assignedTo,
        value: validatedData.value,
        conversationId: validatedData.conversationId,
        campaignId: validatedData.campaignId,
      });
      return sendSuccess(res, lead, 'Lead created successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to create lead', 500);
    }
  },

  /**
   * Update lead
   * PUT /api/leads/:id
   */
  updateLead: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string || req.body.companyId);
      
      if (isNaN(id) || isNaN(companyId)) {
        return sendError(res, 'Invalid ID', 400);
      }

      const validatedData = updateLeadSchema.parse(req.body);
      const lead = await leadService.updateLead(id, companyId, validatedData);
      return sendSuccess(res, lead, 'Lead updated successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to update lead', 500);
    }
  },

  /**
   * Update lead status
   * PUT /api/leads/:id/status
   */
  updateLeadStatus: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string || req.body.companyId);
      const status = req.body.status as LeadStatus;
      const userRole = (req as AuthRequest).user?.role?.name;
      const userId = (req as AuthRequest).user?.id;

      if (isNaN(id) || isNaN(companyId)) {
        return sendError(res, 'Invalid ID', 400);
      }
      if (!status || !['New', 'Contacted', 'Qualified', 'Negotiation', 'Won', 'Lost'].includes(status)) {
        return sendError(res, 'Invalid status', 400);
      }
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      // Only Lead Manager and SuperAdmin can change lead status
      if (userRole !== 'Lead Manager' && userRole !== 'SuperAdmin') {
        return sendError(res, 'Only Lead Manager can change lead status', 403);
      }

      const lead = await leadService.updateLeadStatus(id, companyId, status, userId, userRole === 'SuperAdmin');
      return sendSuccess(res, lead, 'Lead status updated successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to update lead status', 500);
    }
  },

  /**
   * Get Lead Managers list (for monitoring transfer)
   * GET /api/leads/lead-managers
   */
  getLeadManagers: async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const companyId = authReq.user?.companyId;
      if (!companyId) {
        return sendError(res, 'Company ID is required', 400);
      }

      const list = await leadService.getLeadManagers(companyId);
      return sendSuccess(res, list, 'Lead managers retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve lead managers', 500);
    }
  },

  /**
   * Transfer lead monitoring incharge to another Lead Manager
   * PUT /api/leads/:id/monitoring/transfer
   */
  transferLeadMonitoring: async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const companyId = authReq.user?.companyId;
      const userId = authReq.user?.id;
      const userRole = authReq.user?.role?.name;

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendError(res, 'Invalid lead ID', 400);
      }
      if (!companyId) {
        return sendError(res, 'Company ID is required', 400);
      }
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      // Only Lead Manager and SuperAdmin can transfer lead monitoring
      if (userRole !== 'Lead Manager' && userRole !== 'SuperAdmin') {
        return sendError(res, 'Only Lead Manager can transfer monitoring responsibility', 403);
      }

      const { newLeadManagerUserId } = transferLeadMonitoringSchema.parse(req.body);
      const updated = await leadService.transferLeadMonitoring(
        id,
        companyId,
        userId,
        newLeadManagerUserId,
        { bypassMonitoringLock: userRole === 'SuperAdmin' }
      );
      return sendSuccess(res, updated, 'Lead monitoring responsibility transferred successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to transfer monitoring responsibility', 500);
    }
  },

  /**
   * Delete lead
   * DELETE /api/leads/:id
   */
  deleteLead: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string || req.body.companyId);
      
      if (isNaN(id) || isNaN(companyId)) {
        return sendError(res, 'Invalid ID', 400);
      }

      await leadService.deleteLead(id, companyId);
      return sendSuccess(res, null, 'Lead deleted successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to delete lead', 500);
    }
  },

  /**
   * Convert lead to client (creates pending approval request; no login until Finance approves)
   * POST /api/leads/:id/convert
   */
  convertLeadToClient: async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;
      const companyId = authReq.user?.companyId ?? parseInt(req.query.companyId as string || req.body.companyId);
      const userRole = authReq.user?.role?.name;

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendError(res, 'Invalid lead ID', 400);
      }
      if (!companyId || isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }
      if (!userId) {
        return sendError(res, 'User not authenticated', 401);
      }

      // Only Lead Manager and SuperAdmin can convert lead to client
      if (userRole !== 'Lead Manager' && userRole !== 'SuperAdmin') {
        return sendError(res, 'Only Lead Manager can convert lead to client', 403);
      }

      const validatedData = convertLeadSchema.parse(req.body);
      const client = await leadService.convertLeadToClient(
        id,
        companyId,
        userId,
        {
          name: validatedData.name,
          contactInfo: validatedData.contactInfo,
          address: validatedData.address,
          password: validatedData.password,
        },
        { bypassMonitoringLock: userRole === 'SuperAdmin' }
      );
      return sendSuccess(
        res,
        client,
        'Client created. Pending approval. Client can login after Finance approves.'
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to convert lead', 500);
    }
  },

  /**
   * Get lead pipeline
   * GET /api/leads/pipeline?companyId=1
   */
  getLeadPipeline: async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      if (isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const pipeline = await leadService.getLeadPipeline(companyId);
      return sendSuccess(res, pipeline, 'Lead pipeline retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve lead pipeline', 500);
    }
  },

  /**
   * Get leads for client from their campaigns
   * GET /api/leads/client?campaignId=1
   */
  getClientLeads: async (req: AuthRequest, res: Response) => {
    try {
      const clientId = req.user?.id;

      if (!clientId) {
        return sendError(res, 'User not authenticated', 401);
      }

      const filters: any = {};
      if (req.query.campaignId) {
        filters.campaignId = parseInt(req.query.campaignId as string);
        if (isNaN(filters.campaignId)) {
          return sendError(res, 'Invalid campaign ID', 400);
        }
      }

      const leads = await leadService.getClientLeads(clientId, filters);
      return sendSuccess(res, leads, 'Leads retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve leads', 500);
    }
  },

  /**
   * Assign users (employees) to a lead
   * POST /api/leads/:id/assign
   */
  assignUsers: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string || req.body.companyId);
      const employeeIds = Array.isArray(req.body.employeeIds) ? req.body.employeeIds : [req.body.employeeIds].filter(Boolean);

      if (isNaN(id) || isNaN(companyId)) {
        return sendError(res, 'Invalid ID', 400);
      }
      const validIds = employeeIds.map((e: unknown) => typeof e === 'number' ? e : parseInt(String(e), 10)).filter((n: number) => !isNaN(n));
      if (validIds.length === 0) {
        return sendError(res, 'At least one employee ID is required', 400);
      }

      const lead = await leadService.assignUsersToLead(id, companyId, validIds);
      return sendSuccess(res, lead, 'Users assigned to lead successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to assign users to lead', 500);
    }
  },

  /**
   * Remove a user (employee) from a lead
   * DELETE /api/leads/:id/assign/:employeeId
   */
  removeAssignment: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const employeeId = parseInt(req.params.employeeId);
      const companyId = parseInt(req.query.companyId as string || req.body.companyId);

      if (isNaN(id) || isNaN(employeeId) || isNaN(companyId)) {
        return sendError(res, 'Invalid ID', 400);
      }

      const lead = await leadService.removeUserFromLead(id, companyId, employeeId);
      return sendSuccess(res, lead, 'User removed from lead successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to remove user from lead', 500);
    }
  },
};

