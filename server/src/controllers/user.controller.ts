import { Response } from 'express';
import { userService } from '../services/user.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { z } from 'zod';
import { AuthRequest } from '../types/index.js';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  roleId: z.number().int().positive('Role ID must be a positive integer'),
  companyId: z.number().int().positive('Company ID must be a positive integer'),
  profileImage: z.string().url().optional().or(z.literal('')),
});

const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  roleId: z.number().int().positive('Role ID must be a positive integer').optional(),
  profileImage: z.string().url().optional().or(z.literal('')),
});

export const userController = {
  getAllUsers: async (req: AuthRequest, res: Response) => {
    try {
      // SuperAdmin can see all users, others can only see their company users
      const companyId = req.user?.role?.name === 'SuperAdmin' ? undefined : req.user!.companyId;
      const users = await userService.getAllUsers(companyId);
      return sendSuccess(res, users, 'Users retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve users', error.statusCode || 500);
    }
  },

  getUserById: async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id;
      const companyId = req.user?.role?.name === 'SuperAdmin' ? undefined : req.user!.companyId;
      const user = await userService.getUserById(id, companyId);
      return sendSuccess(res, user, 'User retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve user', error.statusCode || 500);
    }
  },

  createUser: async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = createUserSchema.parse(req.body);
      const user = await userService.createUser(validatedData);
      return sendSuccess(res, user, 'User created successfully', 201);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      return sendError(res, error.message || 'Failed to create user', error.statusCode || 500);
    }
  },

  updateUser: async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id;
      const validatedData = updateUserSchema.parse(req.body);
      const companyId = req.user?.role?.name === 'SuperAdmin' ? undefined : req.user!.companyId;
      const updateData: {
        email?: string;
        password?: string;
        roleId?: number;
        profileImage?: string;
      } = {};
      if (validatedData.email) updateData.email = validatedData.email;
      if (validatedData.password) updateData.password = validatedData.password;
      if (validatedData.roleId) updateData.roleId = validatedData.roleId;
      if (validatedData.profileImage !== undefined) updateData.profileImage = validatedData.profileImage;
      const user = await userService.updateUser(id, updateData, companyId);
      return sendSuccess(res, user, 'User updated successfully');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      return sendError(res, error.message || 'Failed to update user', error.statusCode || 500);
    }
  },

  deleteUser: async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id;
      const companyId = req.user?.role?.name === 'SuperAdmin' ? undefined : req.user!.companyId;
      await userService.deleteUser(id, companyId);
      return sendSuccess(res, null, 'User deleted successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to delete user', error.statusCode || 500);
    }
  },
};

