import { z } from 'zod';
import { employeeGroupService } from '../services/employeeGroup.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendSuccess, sendError } from '../utils/response.js';
// Validation schemas
const createGroupSchema = z.object({
    name: z.string().min(1, 'Group name is required'),
    description: z.string().min(1, 'Group description is required'),
    companyId: z.number().int().positive('Company ID must be a positive integer'),
    employeeIds: z.array(z.number().int().positive()).min(1, 'At least one employee is required'),
});
const updateGroupSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    employeeIds: z.array(z.number().int().positive()).optional(),
});
export const employeeGroupController = {
    /**
     * Get all employee groups
     * GET /api/employee-groups?companyId=1
     */
    getAllGroups: async (req, res) => {
        try {
            const companyId = parseInt(req.query.companyId);
            if (!companyId || isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            const groups = await employeeGroupService.getAllGroups(companyId);
            return sendSuccess(res, groups, 'Employee groups retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to retrieve employee groups', 500);
        }
    },
    /**
     * Get employee group by ID
     * GET /api/employee-groups/:id?companyId=1
     */
    getGroupById: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const companyId = parseInt(req.query.companyId);
            if (!id || isNaN(id)) {
                return sendError(res, 'Group ID is required', 400);
            }
            if (!companyId || isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            const group = await employeeGroupService.getGroupById(id, companyId);
            return sendSuccess(res, group, 'Employee group retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to retrieve employee group', 500);
        }
    },
    /**
     * Create employee group
     * POST /api/employee-groups
     */
    createGroup: async (req, res) => {
        try {
            const validatedData = createGroupSchema.parse(req.body);
            // Get creator ID from authenticated user
            const userId = req.user?.id;
            if (!userId) {
                return sendError(res, 'User not authenticated', 401);
            }
            const group = await employeeGroupService.createGroup({
                ...validatedData,
                createdById: userId,
            });
            return sendSuccess(res, group, 'Employee group created successfully', 201);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to create employee group', 500);
        }
    },
    /**
     * Update employee group
     * PUT /api/employee-groups/:id?companyId=1
     */
    updateGroup: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const companyId = parseInt(req.query.companyId);
            if (!id || isNaN(id)) {
                return sendError(res, 'Group ID is required', 400);
            }
            if (!companyId || isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            const validatedData = updateGroupSchema.parse(req.body);
            const group = await employeeGroupService.updateGroup(id, companyId, validatedData);
            return sendSuccess(res, group, 'Employee group updated successfully');
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to update employee group', 500);
        }
    },
    /**
     * Delete employee group
     * DELETE /api/employee-groups/:id?companyId=1
     */
    deleteGroup: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const companyId = parseInt(req.query.companyId);
            if (!id || isNaN(id)) {
                return sendError(res, 'Group ID is required', 400);
            }
            if (!companyId || isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            await employeeGroupService.deleteGroup(id, companyId);
            return sendSuccess(res, null, 'Employee group deleted successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to delete employee group', 500);
        }
    },
    /**
     * Get group members
     * GET /api/employee-groups/:id/members?companyId=1
     */
    getGroupMembers: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const companyId = parseInt(req.query.companyId);
            if (!id || isNaN(id)) {
                return sendError(res, 'Group ID is required', 400);
            }
            if (!companyId || isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            const members = await employeeGroupService.getGroupMembers(id, companyId);
            return sendSuccess(res, members, 'Group members retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to retrieve group members', 500);
        }
    },
};
//# sourceMappingURL=employeeGroup.controller.js.map