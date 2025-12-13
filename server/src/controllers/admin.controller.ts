import { Request, Response } from 'express';
import { adminService } from '../services/admin.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../types/index.js';
import { z } from 'zod';
import { ProjectStatus } from '@prisma/client';

// Validation schemas
const updateProjectSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  budget: z.number().positive().optional(),
  deliveryStartDate: z.string().transform((str) => new Date(str)).optional(),
  deliveryEndDate: z.string().transform((str) => new Date(str)).optional(),
  time: z.string().min(1).optional(),
  status: z.enum(['Draft', 'Submitted', 'InProgress', 'Completed', 'Cancelled']).optional(),
});

const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  contactInfo: z.any().optional(),
  address: z.string().optional(),
});

export const adminController = {
  /**
   * Get all projects
   * GET /api/admin/projects
   */
  getAllProjects: async (req: AuthRequest, res: Response) => {
    try {
      const filters: any = {};
      if (req.query.companyId) filters.companyId = parseInt(req.query.companyId as string);
      if (req.query.status) filters.status = req.query.status as ProjectStatus;
      if (req.query.search) filters.search = req.query.search as string;

      const projects = await adminService.getAllProjects(filters);
      return sendSuccess(res, projects, 'Projects retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve projects', 500);
    }
  },

  /**
   * Get all clients
   * GET /api/admin/clients
   */
  getAllClients: async (req: AuthRequest, res: Response) => {
    try {
      const filters: any = {};
      if (req.query.companyId) filters.companyId = parseInt(req.query.companyId as string);
      if (req.query.search) filters.search = req.query.search as string;

      const clients = await adminService.getAllClients(filters);
      return sendSuccess(res, clients, 'Clients retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve clients', 500);
    }
  },

  /**
   * Update project
   * PUT /api/admin/projects/:id
   */
  updateProject: async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return sendError(res, 'Invalid project ID', 400);
      }

      const validatedData = updateProjectSchema.parse(req.body);

      const project = await adminService.updateProject(id, validatedData);
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
   * Delete project
   * DELETE /api/admin/projects/:id
   */
  deleteProject: async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return sendError(res, 'Invalid project ID', 400);
      }

      await adminService.deleteProject(id);
      return sendSuccess(res, null, 'Project deleted successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to delete project', 500);
    }
  },

  /**
   * Update client
   * PUT /api/admin/clients/:id
   */
  updateClient: async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return sendError(res, 'Invalid client ID', 400);
      }

      const validatedData = updateClientSchema.parse(req.body);

      const client = await adminService.updateClient(id, validatedData);
      return sendSuccess(res, client, 'Client updated successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to update client', 500);
    }
  },

  /**
   * Delete client
   * DELETE /api/admin/clients/:id
   */
  deleteClient: async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return sendError(res, 'Invalid client ID', 400);
      }

      await adminService.deleteClient(id);
      return sendSuccess(res, null, 'Client deleted successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to delete client', 500);
    }
  },

  /**
   * Get client by ID with all details
   * GET /api/admin/clients/:id
   */
  getClientById: async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return sendError(res, 'Invalid client ID', 400);
      }

      const client = await adminService.getClientById(id);
      return sendSuccess(res, client, 'Client details retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve client details', 500);
    }
  },

  /**
   * Get project by ID with all details
   * GET /api/admin/projects/:id
   */
  getProjectById: async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return sendError(res, 'Invalid project ID', 400);
      }

      const project = await adminService.getProjectById(id);
      return sendSuccess(res, project, 'Project details retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve project details', 500);
    }
  },
};

