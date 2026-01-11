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

    // Get user with role for additional info
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { role: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Attach user info to request
    (req as AuthRequest).user = {
      id: payload.id,
      email: payload.email,
      roleId: payload.roleId,
      companyId: payload.companyId,
      role: {
        name: user.role.name,
      },
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

      // SuperAdmin has access to everything
      if (user.role.name === 'SuperAdmin') {
        return next();
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

/**
 * Middleware to check if user can view tasks
 * Allows users to view their own tasks OR users with can_view_tasks permission
 * Also allows users assigned to a specific task (individually or via group) to access it
 * Usage: verifyTaskViewAccess
 */
export const verifyTaskViewAccess = async (req: Request, res: Response, next: NextFunction) => {
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
      include: { role: true, employee: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // SuperAdmin has access to everything
    if (user.role.name === 'SuperAdmin') {
      return next();
    }

    const permissions = user.role.permissions as Record<string, boolean>;

    // Check if user has can_view_tasks permission
    if (permissions['can_view_tasks']) {
      return next();
    }

    // Check if user is accessing their own tasks via userId parameter
    const requestedUserId = req.params.userId;
    if (requestedUserId && requestedUserId === authReq.user.id) {
      return next();
    }

    // Check if user is accessing a specific task (via :id parameter or req.body.taskId) and is assigned to it
    const taskIdFromParams = parseInt(req.params.id);
    const taskIdFromBody = req.body?.taskId ? parseInt(req.body.taskId) : NaN;
    const taskId = !isNaN(taskIdFromParams) ? taskIdFromParams : taskIdFromBody;
    
    if (!isNaN(taskId) && user.employee) {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { assignedEmployee: true },
      });

      if (task) {
        // Check if task is assigned to this employee individually
        if (task.assignedTo === user.employee.id) {
          return next();
        }

        // Check if user is part of a group assigned to this task
        if (task.groupId) {
          const isGroupMember = await prisma.employeeGroupMember.findFirst({
            where: {
              groupId: task.groupId,
              employeeId: user.employee.id,
            },
          });

          if (isGroupMember) {
            return next();
          }
        }
      }
    }

    // If userId parameter is not provided and no taskId, allow (frontend will handle filtering)
    // This handles the case where the frontend calls getUserTasks with the logged-in user's ID
    if (!requestedUserId && isNaN(taskId)) {
      return next();
    }

    // Permission denied
    return res.status(403).json({
      success: false,
      message: 'Permission denied: You can only view your own tasks',
    });
  } catch (error) {
    console.error('Task view permission check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Permission check failed',
    });
  }
};

/**
 * Middleware to check if user can update tasks
 * Allows users to update their own assigned tasks (status only) OR users with can_manage_tasks permission
 * Usage: verifyTaskUpdateAccess
 */
export const verifyTaskUpdateAccess = async (req: Request, res: Response, next: NextFunction) => {
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
      include: { role: true, employee: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // SuperAdmin has access to everything
    if (user.role.name === 'SuperAdmin') {
      return next();
    }

    const permissions = user.role.permissions as Record<string, boolean>;

    // Check if user has can_manage_tasks permission
    if (permissions['can_manage_tasks']) {
      return next();
    }

    // Check if user is updating their own assigned task
    const taskId = parseInt(req.params.id);
    if (!isNaN(taskId)) {
      // Get the task to check if it's assigned to this user
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { assignedEmployee: true },
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found',
        });
      }

      // Check if user has an employee record
      if (!user.employee) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied: Employee record not found',
        });
      }

      // Check if task is assigned to this employee individually
      if (task.assignedTo === user.employee.id) {
        // Check if user is only updating status (allowed) or other fields (not allowed without permission)
        const updateData = req.body;
        const allowedFields = ['status', 'companyId'];
        const isOnlyStatusUpdate = Object.keys(updateData).every(key => 
          allowedFields.includes(key)
        );

        if (isOnlyStatusUpdate) {
          // User can update status of their own task
          return next();
        }
      }

      // Check if user is part of a group assigned to this task
      if (task.groupId) {
        const isGroupMember = await prisma.employeeGroupMember.findFirst({
          where: {
            groupId: task.groupId,
            employeeId: user.employee.id,
          },
        });

        if (isGroupMember) {
          const updateData = req.body;
          const allowedFields = ['status', 'companyId'];
          const isOnlyStatusUpdate = Object.keys(updateData).every(key => 
            allowedFields.includes(key)
          );

          if (isOnlyStatusUpdate) {
            // User can update status of task assigned to their group
            return next();
          }
        }
      }
    }

    // Permission denied
    return res.status(403).json({
      success: false,
      message: 'Permission denied: You can only update status of your own assigned tasks',
    });
  } catch (error) {
    console.error('Task update permission check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Permission check failed',
    });
  }
};

export { authMiddleware as default };

