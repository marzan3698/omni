import { Response } from 'express';
import { roleService } from '../services/role.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { z } from 'zod';
import { AuthRequest } from '../types/index.js';

const updatePermissionsSchema = z.object({
  permissions: z.record(z.string(), z.boolean()),
});

const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(50, 'Role name must be 50 characters or less'),
  permissions: z.record(z.string(), z.boolean()),
});

const updateRoleNameSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(50, 'Role name must be 50 characters or less'),
});

export const roleController = {
  getAllRoles: async (_req: AuthRequest, res: Response) => {
    try {
      const roles = await roleService.getAllRoles();
      return sendSuccess(res, roles, 'Roles retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve roles', 500);
    }
  },

  getRoleById: async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const role = await roleService.getRoleById(id);
      return sendSuccess(res, role, 'Role retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve role', error.statusCode || 500);
    }
  },

  updateRolePermissions: async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updatePermissionsSchema.parse(req.body);
      const role = await roleService.updateRolePermissions(id, validatedData.permissions);
      return sendSuccess(res, role, 'Role permissions updated successfully');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      return sendError(res, error.message || 'Failed to update role permissions', error.statusCode || 500);
    }
  },

  /**
   * Create a new role
   * POST /api/roles
   */
  createRole: async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = createRoleSchema.parse(req.body);
      const role = await roleService.createRole(validatedData.name, validatedData.permissions);
      return sendSuccess(res, role, 'Role created successfully');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      return sendError(res, error.message || 'Failed to create role', error.statusCode || 500);
    }
  },

  /**
   * Update role name
   * PUT /api/roles/:id
   */
  updateRoleName: async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendError(res, 'Invalid role ID', 400);
      }

      const validatedData = updateRoleNameSchema.parse(req.body);
      const role = await roleService.updateRoleName(id, validatedData.name);
      return sendSuccess(res, role, 'Role name updated successfully');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      return sendError(res, error.message || 'Failed to update role name', error.statusCode || 500);
    }
  },

  /**
   * Delete a role
   * DELETE /api/roles/:id
   */
  deleteRole: async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendError(res, 'Invalid role ID', 400);
      }

      const result = await roleService.deleteRole(id);
      return sendSuccess(res, result, result.message || 'Role deleted successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to delete role', error.statusCode || 500);
    }
  },
};

