import { z } from 'zod';
import { leadCallService } from '../services/leadCall.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
const createLeadCallSchema = z.object({
    title: z.string().optional(),
    phoneNumber: z.string().optional(),
    callTime: z.preprocess((val) => (typeof val === 'string' || val instanceof Date ? new Date(val) : val), z.date({ required_error: 'Call time is required' })),
    durationMinutes: z.number().int().positive('Duration must be positive').optional(),
    assignedTo: z.number().int().positive('Assigned employee is required'),
    status: z
        .enum(['Scheduled', 'Completed', 'Canceled', 'NoAnswer', 'Busy', 'LeftVoicemail'])
        .optional(),
    clientId: z.number().int().positive().optional(),
});
const updateLeadCallSchema = createLeadCallSchema.partial();
const addCallNoteSchema = z.object({
    note: z.string().min(1, 'Note is required'),
});
export const leadCallController = {
    /**
     * Get all calls for a lead
     * GET /api/leads/:leadId/calls
     */
    getLeadCalls: async (req, res) => {
        try {
            const leadId = parseInt(req.params.leadId);
            const companyId = parseInt(req.query.companyId || req.body.companyId);
            if (isNaN(leadId)) {
                return sendError(res, 'Invalid lead ID', 400);
            }
            if (isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            const calls = await leadCallService.getLeadCalls(leadId, companyId);
            return sendSuccess(res, calls, 'Lead calls retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to retrieve lead calls', 500);
        }
    },
    /**
     * Create a call for a lead
     * POST /api/leads/:leadId/calls
     */
    createLeadCall: async (req, res) => {
        try {
            const authReq = req;
            const user = authReq.user;
            const leadId = parseInt(req.params.leadId);
            const companyId = user?.companyId || parseInt(req.body.companyId || '');
            if (isNaN(leadId)) {
                return sendError(res, 'Invalid lead ID', 400);
            }
            if (!companyId || isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            if (!user?.id) {
                return sendError(res, 'User ID is required', 400);
            }
            const validatedData = createLeadCallSchema.parse(req.body);
            const call = await leadCallService.createLeadCall({
                companyId,
                leadId,
                clientId: validatedData.clientId,
                assignedTo: validatedData.assignedTo,
                createdBy: user.id,
                title: validatedData.title,
                phoneNumber: validatedData.phoneNumber,
                callTime: validatedData.callTime,
                durationMinutes: validatedData.durationMinutes,
                status: validatedData.status || 'Scheduled',
            });
            return sendSuccess(res, call, 'Lead call created successfully', 201);
        }
        catch (error) {
            console.error('Error creating lead call:', error);
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Full error details:', error);
            return sendError(res, `Failed to create lead call: ${errorMessage}`, 500);
        }
    },
    /**
     * Update a call for a lead
     * PUT /api/leads/:leadId/calls/:id
     */
    updateLeadCall: async (req, res) => {
        try {
            const leadId = parseInt(req.params.leadId);
            const id = parseInt(req.params.id);
            const companyId = parseInt(req.query.companyId || req.body.companyId);
            if (isNaN(leadId) || isNaN(id)) {
                return sendError(res, 'Invalid lead or call ID', 400);
            }
            if (isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            const validatedData = updateLeadCallSchema.parse(req.body);
            const updateData = {
                ...validatedData,
            };
            if (validatedData.callTime) {
                updateData.callTime =
                    validatedData.callTime instanceof Date
                        ? validatedData.callTime
                        : new Date(validatedData.callTime);
            }
            const call = await leadCallService.updateLeadCall(id, leadId, companyId, updateData);
            return sendSuccess(res, call, 'Lead call updated successfully');
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to update lead call', 500);
        }
    },
    /**
     * Delete a call for a lead
     * DELETE /api/leads/:leadId/calls/:id
     */
    deleteLeadCall: async (req, res) => {
        try {
            const leadId = parseInt(req.params.leadId);
            const id = parseInt(req.params.id);
            const companyId = parseInt(req.query.companyId || req.body.companyId);
            if (isNaN(leadId) || isNaN(id)) {
                return sendError(res, 'Invalid lead or call ID', 400);
            }
            if (isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            await leadCallService.deleteLeadCall(id, leadId, companyId);
            return sendSuccess(res, null, 'Lead call deleted successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to delete lead call', 500);
        }
    },
    /**
     * Add/update call notes
     * POST /api/leads/:leadId/calls/:id/notes
     */
    addCallNote: async (req, res) => {
        try {
            const leadId = parseInt(req.params.leadId);
            const id = parseInt(req.params.id);
            const companyId = parseInt(req.query.companyId || req.body.companyId);
            if (isNaN(leadId) || isNaN(id)) {
                return sendError(res, 'Invalid lead or call ID', 400);
            }
            if (isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            const validatedData = addCallNoteSchema.parse(req.body);
            const call = await leadCallService.addCallNote(id, leadId, companyId, validatedData.note);
            return sendSuccess(res, call, 'Call note added successfully');
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to add call note', 500);
        }
    },
    /**
     * Get all calls for a company (role-based filtering)
     * GET /api/calls
     */
    getAllCalls: async (req, res) => {
        try {
            const authReq = req;
            const user = authReq.user;
            if (!user?.companyId) {
                return sendError(res, 'Company ID is required', 400);
            }
            const filters = {};
            // Parse optional filters
            if (req.query.status) {
                filters.status = req.query.status;
            }
            if (req.query.startDate) {
                filters.startDate = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                filters.endDate = new Date(req.query.endDate);
            }
            if (req.query.leadId) {
                filters.leadId = parseInt(req.query.leadId);
                if (isNaN(filters.leadId)) {
                    return sendError(res, 'Invalid lead ID', 400);
                }
            }
            if (req.query.assignedTo) {
                filters.assignedTo = parseInt(req.query.assignedTo);
                if (isNaN(filters.assignedTo)) {
                    return sendError(res, 'Invalid assigned employee ID', 400);
                }
            }
            const calls = await leadCallService.getAllCalls(user.companyId, user.id, user.role?.name, Object.keys(filters).length > 0 ? filters : undefined);
            return sendSuccess(res, calls, 'Calls retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            console.error('Error getting all calls:', error);
            return sendError(res, 'Failed to retrieve calls', 500);
        }
    },
    /**
     * Get upcoming calls for current user
     * GET /api/calls/upcoming
     */
    getUpcomingCalls: async (req, res) => {
        try {
            const authReq = req;
            const user = authReq.user;
            if (!user?.id) {
                return sendError(res, 'User ID is required', 400);
            }
            if (!user?.companyId) {
                return sendError(res, 'Company ID is required', 400);
            }
            const calls = await leadCallService.getUpcomingCalls(user.id, user.companyId);
            return sendSuccess(res, calls, 'Upcoming calls retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            console.error('Error getting upcoming calls:', error);
            return sendError(res, 'Failed to retrieve upcoming calls', 500);
        }
    },
};
//# sourceMappingURL=leadCall.controller.js.map