import { Response } from 'express';
import { roleService } from '../services/role.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { z } from 'zod';
import { AuthRequest } from '../types/index.js';

const updatePermissionsSchema = z.object({
  permissions: z.record(z.string(), z.boolean()),
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
};

