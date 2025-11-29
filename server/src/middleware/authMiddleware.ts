import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { AppError } from './errorHandler.js';
import { AuthRequest } from '../types/index.js';
import { prisma } from '../lib/prisma.js';

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = authService.verifyToken(token);

    // Attach user info to request
    (req as AuthRequest).user = {
      id: payload.id,
      email: payload.email,
      roleId: payload.roleId,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * Middleware to check if user has required role(s)
 * Usage: verifyRole(['Admin', 'Manager'])
 */
export const verifyRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;

      if (!authReq.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      // Get user's role
      const user = await prisma.user.findUnique({
        where: { id: authReq.user.id },
        include: { role: true },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(user.role.name)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed',
      });
    }
  };
};

/**
 * Middleware to check if user has specific permission
 * Usage: verifyPermission('can_delete_users')
 */
export const verifyPermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;

      if (!authReq.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      // Get user's role with permissions
      const user = await prisma.user.findUnique({
        where: { id: authReq.user.id },
        include: { role: true },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const permissions = user.role.permissions as Record<string, boolean>;

      // Check if user has the required permission
      if (!permissions[permission]) {
        return res.status(403).json({
          success: false,
          message: `Permission denied: ${permission}`,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Permission check failed',
      });
    }
  };
};

export { authMiddleware as default };

