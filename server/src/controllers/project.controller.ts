import { Request, Response } from 'express';
import { projectService } from '../services/project.service.js';
import { invoiceService } from '../services/invoice.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../types/index.js';
import { z } from 'zod';
import { ProjectStatus } from '@prisma/client';

// Validation schemas
const createProjectSchema = z.object({
  serviceId: z.number().int().positive('Service ID is required'),
  title: z.string().optional(),
  description: z.string().optional(),
  budget: z.number().positive('Budget must be greater than 0'),
  deliveryStartDate: z.string().transform((str) => new Date(str)).optional(),
  deliveryEndDate: z.string().transform((str) => new Date(str)).optional(),
  time: z.string().min(1, 'Time is required'),
});

const updateProjectSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  budget: z.number().positive().optional(),
  time: z.string().min(1).optional(),
  status: z.enum(['Draft', 'Submitted', 'InProgress', 'Completed', 'Cancelled']).optional(),
});

const signProjectSchema = z.object({
  signature: z.string().min(1, 'Signature is required'),
});

export const projectController = {
  /**
   * Get all projects for the authenticated client
   * GET /api/projects
   */
  getClientProjects: async (req: AuthRequest, res: Response) => {
    try {
      const clientId = req.user?.id;

      if (!clientId) {
        return sendError(res, 'User not authenticated', 401);
      }

      const projects = await projectService.getClientProjects(clientId);
      return sendSuccess(res, projects, 'Projects retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve projects', 500);
    }
  },

  /**
   * Get project by ID
   * GET /api/projects/:id
   */
  getProjectById: async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const clientId = req.user?.id;

      if (isNaN(id)) {
        return sendError(res, 'Invalid project ID', 400);
      }

      if (!clientId) {
        return sendError(res, 'User not authenticated', 401);
      }

      const project = await projectService.getProjectById(id, clientId);
      return sendSuccess(res, project, 'Project retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve project', 500);
    }
  },

  /**
   * Create a new project
   * POST /api/projects
   */
  createProject: async (req: AuthRequest, res: Response) => {
    try {
      const clientId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!clientId) {
        return sendError(res, 'User not authenticated', 401);
      }

      if (!companyId) {
        return sendError(res, 'Company ID is required', 400);
      }

      const validatedData = createProjectSchema.parse(req.body);

      const project = await projectService.createProject({
        ...validatedData,
        companyId,
        clientId,
      });

      return sendSuccess(res, project, 'Project created successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to create project', 500);
    }
  },

  /**
   * Update project
   * PUT /api/projects/:id
   */
  updateProject: async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const clientId = req.user?.id;

      if (isNaN(id)) {
        return sendError(res, 'Invalid project ID', 400);
      }

      if (!clientId) {
        return sendError(res, 'User not authenticated', 401);
      }

      const validatedData = updateProjectSchema.parse(req.body);

      // Clients can only update their own projects and cannot change status
      const { status, ...updateData } = validatedData;

      const project = await projectService.updateProject(id, clientId, updateData);
      return sendSuccess(res, project, 'Project updated successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to update project', 500);
    }
  },

  /**
   * Sign project (submit e-signature)
   * POST /api/projects/:id/sign
   */
  signProject: async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const clientId = req.user?.id;

      if (isNaN(id)) {
        return sendError(res, 'Invalid project ID', 400);
      }

      if (!clientId) {
        return sendError(res, 'User not authenticated', 401);
      }

      const validatedData = signProjectSchema.parse(req.body);

      const project = await projectService.signProject(id, clientId, validatedData);

      // Generate invoice when project is submitted
      let invoice = null;
      if (project.status === 'Submitted') {
        try {
          console.log(`[Invoice Generation] Starting invoice generation for project ${project.id}`);
          invoice = await invoiceService.generateInvoiceFromProject(project.id);
          console.log(`[Invoice Generation] Invoice created successfully: ${invoice?.invoiceNumber || 'N/A'} (ID: ${invoice?.id || 'N/A'})`);
        } catch (invoiceError: any) {
          console.error('[Invoice Generation] Error generating invoice:', invoiceError);
          console.error('[Invoice Generation] Error details:', {
            message: invoiceError?.message,
            stack: invoiceError?.stack,
            projectId: project.id,
          });
          // Don't fail the request if invoice generation fails, but log the error
        }
      } else {
        console.log(`[Invoice Generation] Project status is ${project.status}, skipping invoice generation`);
      }

      // Fetch the project with invoice relation to ensure it's included in response
      const projectWithInvoice = await projectService.getProjectById(project.id, clientId);

      return sendSuccess(res, { project: projectWithInvoice, invoice }, 'Project signed successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to sign project', 500);
    }
  },

  /**
   * Update project status (admin only)
   * PUT /api/projects/:id/status
   */
  updateProjectStatus: async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const status = req.body.status as ProjectStatus;

      if (isNaN(id)) {
        return sendError(res, 'Invalid project ID', 400);
      }

      if (!status || !['Draft', 'Submitted', 'InProgress', 'Completed', 'Cancelled'].includes(status)) {
        return sendError(res, 'Invalid status', 400);
      }

      const project = await projectService.updateProjectStatus(id, status);
      return sendSuccess(res, project, 'Project status updated successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to update project status', 500);
    }
  },

  /**
   * Get project statistics for the authenticated client
   * GET /api/projects/stats
   */
  getClientProjectStats: async (req: AuthRequest, res: Response) => {
    try {
      const clientId = req.user?.id;

      if (!clientId) {
        return sendError(res, 'User not authenticated', 401);
      }

      const stats = await projectService.getClientProjectStats(clientId);
      return sendSuccess(res, stats, 'Project statistics retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve project statistics', 500);
    }
  },
};

