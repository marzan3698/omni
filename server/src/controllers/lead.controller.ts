import { Request, Response } from 'express';
import { leadService } from '../services/lead.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { LeadSource, LeadStatus } from '@prisma/client';

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
      const companyId = parseInt(req.query.companyId as string);
      if (isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const filters: any = {};
      if (req.query.status) filters.status = req.query.status as LeadStatus;
      if (req.query.source) filters.source = req.query.source as LeadSource;
      if (req.query.assignedTo) filters.assignedTo = parseInt(req.query.assignedTo as string);

      const leads = await leadService.getAllLeads(companyId, filters);
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
      const companyId = parseInt(req.query.companyId as string || req.body.companyId);
      
      if (isNaN(conversationId) || isNaN(companyId)) {
        return sendError(res, 'Invalid ID', 400);
      }

      const validatedData = createLeadFromInboxSchema.parse(req.body);
      const lead = await leadService.createLeadFromInbox(conversationId, companyId, validatedData);
      return sendSuccess(res, lead, 'Lead created from inbox successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
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

