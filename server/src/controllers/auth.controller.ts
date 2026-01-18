import { Response } from 'express';
import { authService } from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../types/index.js';
import { z } from 'zod';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  roleId: z.number().int().positive().optional(),
  companyId: z.number().int().positive('Company ID is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerClientSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const authController = {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  register: async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = registerSchema.parse(req.body);

      const result = await authService.register(validatedData);

      return sendSuccess(res, result, 'User registered successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }

      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }

      return sendError(res, 'Registration failed', 500);
    }
  },

  /**
   * Login user
   * POST /api/auth/login
   */
  login: async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = loginSchema.parse(req.body);

      const result = await authService.login(validatedData);

      return sendSuccess(res, result, 'Login successful');
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }

      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }

      // Log actual error for debugging
      console.error('Login error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

      return sendError(res, 'Login failed', 500);
    }
  },

  /**
   * Register a new client
   * POST /api/auth/register-client
   */
  registerClient: async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = registerClientSchema.parse(req.body);

      const result = await authService.registerClient(validatedData);

      return sendSuccess(res, result, 'Client registered successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }

      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }

      return sendError(res, 'Registration failed', 500);
    }
  },

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  getProfile: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return sendError(res, 'User not authenticated', 401);
      }

      const profile = await authService.getProfile(userId);

      return sendSuccess(res, profile, 'Profile retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }

      return sendError(res, 'Failed to retrieve profile', 500);
    }
  },
};

