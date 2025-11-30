import { Request, Response } from 'express';
import { taskService } from '../services/task.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { AuthRequest } from '../types/index.js';
import { TaskPriority, TaskStatus } from '@prisma/client';

// Validation schemas
const createTaskSchema = z.object({
  companyId: z.number().int().positive(),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  dueDate: z.string().datetime().or(z.date()).optional(),
  assignedTo: z.number().int().positive().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  dueDate: z.string().datetime().or(z.date()).optional(),
  assignedTo: z.number().int().positive().optional(),
  status: z.enum(['Todo', 'InProgress', 'Done']).optional(),
});

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
});

export const taskController = {
  /**
   * Get all tasks
   * GET /api/tasks?companyId=1&status=Todo&priority=High&assignedTo=1
   */
  getAllTasks: async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      if (isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const filters: any = {};
      if (req.query.status) {
        filters.status = req.query.status as TaskStatus;
      }
      if (req.query.priority) {
        filters.priority = req.query.priority as TaskPriority;
      }
      if (req.query.assignedTo) {
        filters.assignedTo = parseInt(req.query.assignedTo as string);
      }

      const tasks = await taskService.getAllTasks(companyId, filters);
      return sendSuccess(res, tasks, 'Tasks retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve tasks', 500);
    }
  },

  /**
   * Get task by ID
   * GET /api/tasks/:id
   */
  getTaskById: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string || req.body.companyId);
      
      if (isNaN(id)) {
        return sendError(res, 'Invalid task ID', 400);
      }
      if (isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const task = await taskService.getTaskById(id, companyId);
      return sendSuccess(res, task, 'Task retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve task', 500);
    }
  },

  /**
   * Create task
   * POST /api/tasks
   */
  createTask: async (req: Request, res: Response) => {
    try {
      const validatedData = createTaskSchema.parse(req.body);
      const task = await taskService.createTask({
        ...validatedData,
        dueDate: validatedData.dueDate ? (validatedData.dueDate instanceof Date ? validatedData.dueDate : new Date(validatedData.dueDate)) : undefined,
      });
      return sendSuccess(res, task, 'Task created successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to create task', 500);
    }
  },

  /**
   * Update task
   * PUT /api/tasks/:id
   */
  updateTask: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string || req.body.companyId);
      
      if (isNaN(id)) {
        return sendError(res, 'Invalid task ID', 400);
      }
      if (isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const validatedData = updateTaskSchema.parse(req.body);
      const task = await taskService.updateTask(id, companyId, {
        ...validatedData,
        dueDate: validatedData.dueDate ? (validatedData.dueDate instanceof Date ? validatedData.dueDate : new Date(validatedData.dueDate)) : undefined,
      });
      return sendSuccess(res, task, 'Task updated successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to update task', 500);
    }
  },

  /**
   * Delete task
   * DELETE /api/tasks/:id
   */
  deleteTask: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string || req.body.companyId);
      
      if (isNaN(id)) {
        return sendError(res, 'Invalid task ID', 400);
      }
      if (isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      await taskService.deleteTask(id, companyId);
      return sendSuccess(res, null, 'Task deleted successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to delete task', 500);
    }
  },

  /**
   * Update task status
   * PUT /api/tasks/:id/status
   */
  updateTaskStatus: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string || req.body.companyId);
      const status = req.body.status as TaskStatus;
      
      if (isNaN(id)) {
        return sendError(res, 'Invalid task ID', 400);
      }
      if (isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }
      if (!status || !['Todo', 'InProgress', 'Done'].includes(status)) {
        return sendError(res, 'Invalid status', 400);
      }

      const task = await taskService.updateTaskStatus(id, companyId, status);
      return sendSuccess(res, task, 'Task status updated successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to update task status', 500);
    }
  },

  /**
   * Add task comment
   * POST /api/tasks/:id/comments
   */
  addTaskComment: async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      const authReq = req as AuthRequest;
      
      if (isNaN(taskId)) {
        return sendError(res, 'Invalid task ID', 400);
      }
      if (!authReq.user) {
        return sendError(res, 'User not authenticated', 401);
      }

      const validatedData = createCommentSchema.parse(req.body);
      const comment = await taskService.addTaskComment({
        taskId,
        userId: authReq.user.id,
        content: validatedData.content,
      });
      return sendSuccess(res, comment, 'Comment added successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to add comment', 500);
    }
  },

  /**
   * Get task comments
   * GET /api/tasks/:id/comments
   */
  getTaskComments: async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      
      if (isNaN(taskId)) {
        return sendError(res, 'Invalid task ID', 400);
      }

      const comments = await taskService.getTaskComments(taskId);
      return sendSuccess(res, comments, 'Comments retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve comments', 500);
    }
  },
};

