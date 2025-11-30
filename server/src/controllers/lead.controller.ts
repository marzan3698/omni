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
  assignedTo: z.number().int().positive().optional(),
  value: z.number().positive().optional(),
  conversationId: z.number().int().positive().optional(),
});

const createLeadFromInboxSchema = z.object({
  title: z.string().min(1, 'Lead title is required'),
  description: z.string().optional(),
  assignedTo: z.number().int().positive().optional(),
  value: z.number().positive().optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  phone: z.string().min(1, 'Phone is required'),
  categoryId: z.number().int().positive('Category is required'),
  interestId: z.number().int().positive('Interest is required'),
});

const convertLeadSchema = z.object({
  name: z.string().min(1).optional(),
  contactInfo: z.any().optional(),
  address: z.string().optional(),
});

export const leadController = {
  /**
   * Get all leads
   * GET /api/leads?companyId=1&status=New&source=Inbox
   */
  getAllLeads: async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthRequest).user?.id;
      const userRole = (req as AuthRequest).user?.roleName;

      const filters: any = {};
      
      // If not Lead Manager or SuperAdmin, only show leads created by this user
      if (userRole !== 'Lead Manager' && userRole !== 'SuperAdmin') {
        if (!userId) {
          return sendError(res, 'User ID not found', 400);
        }
        filters.createdBy = userId;
      }
      
      // Apply filters
      if (req.query.status) filters.status = req.query.status as LeadStatus;
      if (req.query.source) filters.source = req.query.source as LeadSource;
      if (req.query.assignedTo) filters.assignedTo = parseInt(req.query.assignedTo as string);
      if (req.query.categoryId) filters.categoryId = parseInt(req.query.categoryId as string);
      if (req.query.interestId) filters.interestId = parseInt(req.query.interestId as string);
      if (req.query.search) filters.search = req.query.search as string;
      if (req.query.createdBy) filters.createdBy = req.query.createdBy as string;

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
      
      if (body.categoryId !== undefined && body.categoryId !== null && body.categoryId !== '') {
        body.categoryId = typeof body.categoryId === 'string' ? parseInt(body.categoryId, 10) : body.categoryId;
        if (isNaN(body.categoryId) || body.categoryId <= 0) {
          return sendError(res, 'Category is required', 400);
        }
      } else {
        return sendError(res, 'Category is required', 400);
      }
      
      if (body.interestId !== undefined && body.interestId !== null && body.interestId !== '') {
        body.interestId = typeof body.interestId === 'string' ? parseInt(body.interestId, 10) : body.interestId;
        if (isNaN(body.interestId) || body.interestId <= 0) {
          return sendError(res, 'Interest is required', 400);
        }
      } else {
        return sendError(res, 'Interest is required', 400);
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

      const validatedData = createLeadFromInboxSchema.parse(body);
      console.log('Validated data:', JSON.stringify(validatedData, null, 2));

      const lead = await leadService.createLeadFromInbox(conversationId, userId, validatedData);
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
      const validatedData = createLeadSchema.parse(req.body);
      const lead = await leadService.createLead(validatedData);
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

      const validatedData = createLeadSchema.partial().parse(req.body);
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
      
      if (isNaN(id) || isNaN(companyId)) {
        return sendError(res, 'Invalid ID', 400);
      }
      if (!status || !['New', 'Contacted', 'Qualified', 'Negotiation', 'Won', 'Lost'].includes(status)) {
        return sendError(res, 'Invalid status', 400);
      }

      const lead = await leadService.updateLeadStatus(id, companyId, status);
      return sendSuccess(res, lead, 'Lead status updated successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to update lead status', 500);
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
   * Convert lead to client
   * POST /api/leads/:id/convert
   */
  convertLeadToClient: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string || req.body.companyId);
      
      if (isNaN(id) || isNaN(companyId)) {
        return sendError(res, 'Invalid ID', 400);
      }

      const validatedData = convertLeadSchema.parse(req.body);
      const client = await leadService.convertLeadToClient(id, companyId, validatedData);
      return sendSuccess(res, client, 'Lead converted to client successfully');
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
};

