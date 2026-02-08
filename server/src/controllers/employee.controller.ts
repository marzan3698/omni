import { Request, Response } from 'express';
import { employeeService } from '../services/employee.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { AuthRequest } from '../types/index.js';

// Validation schemas
const createEmployeeSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  companyId: z.number().int().positive(),
  department: z.string().optional(),
  departmentId: z.number().int().positive().optional(),
  designation: z.string().optional(),
  salary: z.number().positive().optional(),
  workHours: z.number().nonnegative().optional(),
  holidays: z.number().int().nonnegative().optional(),
  bonus: z.number().nonnegative().optional(),
  responsibilities: z.string().optional(),
  joinDate: z.string().datetime().or(z.date()).optional(),
});

const updateEmployeeSchema = z.object({
  department: z.string().optional(),
  departmentId: z.number().int().positive().optional(),
  designation: z.string().optional(),
  salary: z.number().positive().optional(),
  workHours: z.number().nonnegative().optional(),
  holidays: z.number().int().nonnegative().optional(),
  bonus: z.number().nonnegative().optional(),
  responsibilities: z.string().optional(),
  joinDate: z.string().datetime().or(z.date()).optional(),
});

export const employeeController = {
  /**
   * Get all employees
   * GET /api/employees?companyId=1
   */
  getAllEmployees: async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      if (isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const employees = await employeeService.getAllEmployees(companyId);
      return sendSuccess(res, employees, 'Employees retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve employees', 500);
    }
  },

  /**
   * Get employee by ID
   * GET /api/employees/:id
   */
  getEmployeeById: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string || req.body.companyId);
      
      if (isNaN(id)) {
        return sendError(res, 'Invalid employee ID', 400);
      }
      if (isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const employee = await employeeService.getEmployeeById(id, companyId);
      return sendSuccess(res, employee, 'Employee retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve employee', 500);
    }
  },

  /**
   * Create employee
   * POST /api/employees
   */
  createEmployee: async (req: Request, res: Response) => {
    try {
      const validatedData = createEmployeeSchema.parse(req.body);
      const employee = await employeeService.createEmployee({
        ...validatedData,
        joinDate: validatedData.joinDate ? (validatedData.joinDate instanceof Date ? validatedData.joinDate : new Date(validatedData.joinDate)) : undefined,
      });
      return sendSuccess(res, employee, 'Employee created successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to create employee', 500);
    }
  },

  /**
   * Update employee
   * PUT /api/employees/:id
   */
  updateEmployee: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string || req.body.companyId);
      
      if (isNaN(id)) {
        return sendError(res, 'Invalid employee ID', 400);
      }
      if (isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const validatedData = updateEmployeeSchema.parse(req.body);
      const employee = await employeeService.updateEmployee(id, companyId, {
        ...validatedData,
        joinDate: validatedData.joinDate ? (validatedData.joinDate instanceof Date ? validatedData.joinDate : new Date(validatedData.joinDate)) : undefined,
      });
      return sendSuccess(res, employee, 'Employee updated successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to update employee', 500);
    }
  },

  /**
   * Delete employee
   * DELETE /api/employees/:id
   */
  deleteEmployee: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string || req.body.companyId);
      
      if (isNaN(id)) {
        return sendError(res, 'Invalid employee ID', 400);
      }
      if (isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      await employeeService.deleteEmployee(id, companyId);
      return sendSuccess(res, null, 'Employee deleted successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to delete employee', 500);
    }
  },

  /**
   * Get employee tasks
   * GET /api/employees/:id/tasks
   */
  getEmployeeTasks: async (req: Request, res: Response) => {
    try {
      const employeeId = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string || req.body.companyId);
      
      if (isNaN(employeeId)) {
        return sendError(res, 'Invalid employee ID', 400);
      }
      if (isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const tasks = await employeeService.getEmployeeTasks(employeeId, companyId);
      return sendSuccess(res, tasks, 'Tasks retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve tasks', 500);
    }
  },

  /**
   * Get employee performance
   * GET /api/employees/:id/performance
   */
  getEmployeePerformance: async (req: Request, res: Response) => {
    try {
      const employeeId = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string || req.body.companyId);
      
      if (isNaN(employeeId)) {
        return sendError(res, 'Invalid employee ID', 400);
      }
      if (isNaN(companyId)) {
        return sendError(res, 'Company ID is required', 400);
      }

      const performance = await employeeService.getEmployeePerformance(employeeId, companyId);
      return sendSuccess(res, performance, 'Performance data retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve performance data', 500);
    }
  },

  /**
   * Get current user's balance and points
   * GET /api/employees/me/balance-points
   */
  getMyBalancePoints: async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthRequest).user?.id;
      const companyId = (req as AuthRequest).user?.companyId;
      
      if (!userId) {
        return sendError(res, 'User not authenticated', 401);
      }

      const balancePoints = await employeeService.getEmployeeBalancePoints(userId, companyId);
      return sendSuccess(res, balancePoints, 'Balance and points retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to retrieve balance and points', 500);
    }
  },
};

