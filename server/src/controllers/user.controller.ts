import { Response } from 'express';
import { userService } from '../services/user.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { z } from 'zod';
import { AuthRequest } from '../types/index.js';
import { prisma } from '../lib/prisma.js';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  roleId: z.number().int().positive('Role ID must be a positive integer'),
  companyId: z.number().int().positive('Company ID must be a positive integer'),
  name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
  profileImage: z.string().optional().nullable().or(z.literal('').transform(() => null)),
  eSignature: z.string().optional().nullable().or(z.literal('').transform(() => null)),
});

const updateUserSchema = z.object({
  name: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional().nullable(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  address: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
  roleId: z.number().int().positive('Role ID must be a positive integer').optional(),
  companyId: z.number().int().positive('Company ID must be a positive integer').optional(),
  profileImage: z.string().optional().nullable().or(z.literal('').transform(() => null)),
  eSignature: z.string().optional().nullable().or(z.literal('').transform(() => null)),
  // Employee fields
  designation: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  salary: z.number().nonnegative().optional().nullable(),
  workHours: z.number().nonnegative().optional().nullable(),
  holidays: z.number().int().nonnegative().optional().nullable(),
  bonus: z.number().nonnegative().optional().nullable(),
  responsibilities: z.string().optional().nullable(),
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
        name?: string | null;
        email?: string;
        phone?: string | null;
        password?: string;
        address?: string | null;
        education?: string | null;
        roleId?: number;
        companyId?: number;
        profileImage?: string | null;
        eSignature?: string | null;
        designation?: string | null;
        department?: string | null;
        salary?: number | null;
        workHours?: number | null;
        holidays?: number | null;
        bonus?: number | null;
        responsibilities?: string | null;
      } = {};
      if (validatedData.name !== undefined) updateData.name = validatedData.name || null;
      if (validatedData.email) updateData.email = validatedData.email;
      if (validatedData.phone !== undefined) updateData.phone = validatedData.phone || null;
      if (validatedData.password) updateData.password = validatedData.password;
      if (validatedData.address !== undefined) updateData.address = validatedData.address || null;
      if (validatedData.education !== undefined) updateData.education = validatedData.education || null;
      if (validatedData.roleId) updateData.roleId = validatedData.roleId;
      if (validatedData.companyId) {
        // Verify company exists
        const company = await prisma.company.findUnique({
          where: { id: validatedData.companyId },
        });
        if (!company) {
          return sendError(res, 'Company not found', 404);
        }
        updateData.companyId = validatedData.companyId;
      }
      if (validatedData.profileImage !== undefined) updateData.profileImage = validatedData.profileImage || null;
      if (validatedData.eSignature !== undefined) updateData.eSignature = validatedData.eSignature || null;
      if (validatedData.designation !== undefined) updateData.designation = validatedData.designation || null;
      if (validatedData.department !== undefined) updateData.department = validatedData.department || null;
      if (validatedData.salary !== undefined) updateData.salary = validatedData.salary || null;
      if (validatedData.workHours !== undefined) updateData.workHours = validatedData.workHours || null;
      if (validatedData.holidays !== undefined) updateData.holidays = validatedData.holidays || null;
      if (validatedData.bonus !== undefined) updateData.bonus = validatedData.bonus || null;
      if (validatedData.responsibilities !== undefined) updateData.responsibilities = validatedData.responsibilities || null;
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

