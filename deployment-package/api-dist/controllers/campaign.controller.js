import { campaignService } from '../services/campaign.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
// Validation schemas
const createCampaignSchema = z.object({
    companyId: z.number().int().positive(),
    projectId: z.number().int().positive('Project ID is required'),
    name: z.string().min(1, 'Campaign name is required'),
    description: z.string().optional(),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()),
    budget: z.number().positive('Budget must be greater than 0'),
    type: z.enum(['reach', 'sale', 'research']),
    productIds: z.array(z.number().int().positive()).optional(),
    groupIds: z.array(z.number().int().positive()).optional(),
});
const updateCampaignSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional(),
    budget: z.number().positive().optional(),
    type: z.enum(['reach', 'sale', 'research']).optional(),
    productIds: z.array(z.number().int().positive()).optional(),
    projectId: z.number().int().positive().optional(),
    groupIds: z.array(z.number().int().positive()).optional(),
    isActive: z.boolean().optional(),
});
export const campaignController = {
    /**
     * Get all campaigns
     * GET /api/campaigns?companyId=1&type=sale&active=true
     */
    getAllCampaigns: async (req, res) => {
        try {
            const companyId = parseInt(req.query.companyId);
            const userRole = req.user?.roleName;
            if (!companyId || isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            const filters = {};
            if (req.query.type) {
                filters.type = req.query.type;
            }
            if (req.query.active !== undefined) {
                filters.active = req.query.active === 'true';
            }
            const campaigns = await campaignService.getAllCampaigns(companyId, filters);
            return sendSuccess(res, campaigns, 'Campaigns retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to retrieve campaigns', 500);
        }
    },
    /**
     * Get campaign by ID
     * GET /api/campaigns/:id?companyId=1
     */
    getCampaignById: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const companyId = parseInt(req.query.companyId);
            if (isNaN(id) || isNaN(companyId)) {
                return sendError(res, 'Invalid ID', 400);
            }
            const campaign = await campaignService.getCampaignById(id, companyId);
            return sendSuccess(res, campaign, 'Campaign retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to retrieve campaign', 500);
        }
    },
    /**
     * Create campaign
     * POST /api/campaigns
     */
    createCampaign: async (req, res) => {
        try {
            const validatedData = createCampaignSchema.parse(req.body);
            // Convert date strings to Date objects if needed
            const campaignData = {
                companyId: validatedData.companyId,
                projectId: validatedData.projectId,
                name: validatedData.name,
                description: validatedData.description,
                startDate: validatedData.startDate instanceof Date
                    ? validatedData.startDate
                    : new Date(validatedData.startDate),
                endDate: validatedData.endDate instanceof Date
                    ? validatedData.endDate
                    : new Date(validatedData.endDate),
                budget: validatedData.budget,
                type: validatedData.type,
                productIds: validatedData.productIds,
                groupIds: validatedData.groupIds,
            };
            const campaign = await campaignService.createCampaign(campaignData);
            return sendSuccess(res, campaign, 'Campaign created successfully', 201);
        }
        catch (error) {
            console.error('Error creating campaign:', error);
            if (error instanceof z.ZodError) {
                console.error('Validation errors:', error.errors);
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            const errorMessage = error instanceof Error ? error.message : 'Failed to create campaign';
            return sendError(res, errorMessage, 500);
        }
    },
    /**
     * Update campaign
     * PUT /api/campaigns/:id?companyId=1
     */
    updateCampaign: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const companyId = parseInt(req.query.companyId || req.body.companyId);
            if (isNaN(id) || isNaN(companyId)) {
                return sendError(res, 'Invalid ID', 400);
            }
            const validatedData = updateCampaignSchema.parse(req.body);
            // Convert date strings to Date objects if needed
            const updateData = { ...validatedData };
            if (updateData.startDate && !(updateData.startDate instanceof Date)) {
                updateData.startDate = new Date(updateData.startDate);
            }
            if (updateData.endDate && !(updateData.endDate instanceof Date)) {
                updateData.endDate = new Date(updateData.endDate);
            }
            // Include productIds in updateData if provided
            if (validatedData.productIds !== undefined) {
                updateData.productIds = validatedData.productIds;
            }
            // Include clientIds in updateData if provided
            if (validatedData.clientIds !== undefined) {
                updateData.clientIds = validatedData.clientIds;
            }
            // Include employeeIds in updateData if provided
            if (validatedData.employeeIds !== undefined) {
                updateData.employeeIds = validatedData.employeeIds;
            }
            // Include groupIds in updateData if provided
            if (validatedData.groupIds !== undefined) {
                updateData.groupIds = validatedData.groupIds;
            }
            const campaign = await campaignService.updateCampaign(id, companyId, updateData);
            return sendSuccess(res, campaign, 'Campaign updated successfully');
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to update campaign', 500);
        }
    },
    /**
     * Delete campaign
     * DELETE /api/campaigns/:id?companyId=1
     */
    deleteCampaign: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const companyId = parseInt(req.query.companyId || req.body.companyId);
            if (isNaN(id) || isNaN(companyId)) {
                return sendError(res, 'Invalid ID', 400);
            }
            await campaignService.deleteCampaign(id, companyId);
            return sendSuccess(res, null, 'Campaign deleted successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to delete campaign', 500);
        }
    },
    /**
     * Get campaign statistics
     * GET /api/campaigns/:id/statistics?companyId=1
     */
    getCampaignStatistics: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const companyId = parseInt(req.query.companyId);
            if (isNaN(id) || isNaN(companyId)) {
                return sendError(res, 'Invalid ID', 400);
            }
            const statistics = await campaignService.getCampaignStatistics(id, companyId);
            return sendSuccess(res, statistics, 'Campaign statistics retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to retrieve campaign statistics', 500);
        }
    },
    /**
     * Get active campaigns
     * GET /api/campaigns/active?companyId=1
     */
    getActiveCampaigns: async (req, res) => {
        try {
            const companyId = parseInt(req.query.companyId);
            if (!companyId || isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            const campaigns = await campaignService.getActiveCampaigns(companyId);
            return sendSuccess(res, campaigns, 'Active campaigns retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to retrieve active campaigns', 500);
        }
    },
    /**
     * Get campaign groups (employee groups assigned to campaign)
     * GET /api/campaigns/:id/groups?companyId=1
     */
    getCampaignGroups: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const companyId = parseInt(req.query.companyId);
            if (!id || isNaN(id)) {
                return sendError(res, 'Campaign ID is required', 400);
            }
            if (!companyId || isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            const groups = await campaignService.getCampaignGroups(id, companyId);
            return sendSuccess(res, groups, 'Campaign groups retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to retrieve campaign groups', 500);
        }
    },
    /**
     * Get campaign products
     * GET /api/campaigns/:id/products?companyId=1
     */
    getCampaignProducts: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const companyId = parseInt(req.query.companyId);
            if (!id || isNaN(id)) {
                return sendError(res, 'Campaign ID is required', 400);
            }
            if (!companyId || isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            const products = await campaignService.getCampaignProducts(id, companyId);
            return sendSuccess(res, products, 'Campaign products retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to retrieve campaign products', 500);
        }
    },
    /**
     * Get campaign clients
     * GET /api/campaigns/:id/clients?companyId=1
     */
    getCampaignClients: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const companyId = parseInt(req.query.companyId);
            if (!id || isNaN(id)) {
                return sendError(res, 'Campaign ID is required', 400);
            }
            if (!companyId || isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            const clients = await campaignService.getCampaignClients(id, companyId);
            return sendSuccess(res, clients, 'Campaign clients retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to retrieve campaign clients', 500);
        }
    },
    /**
     * Get campaigns for authenticated client
     * GET /api/campaigns/client
     */
    getClientCampaigns: async (req, res) => {
        try {
            const authReq = req;
            const clientId = authReq.user?.id;
            const companyId = authReq.user?.companyId;
            if (!clientId) {
                return sendError(res, 'User not authenticated', 401);
            }
            if (!companyId) {
                return sendError(res, 'Company ID not found', 400);
            }
            const campaigns = await campaignService.getClientCampaigns(clientId, companyId);
            return sendSuccess(res, campaigns, 'Client campaigns retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to retrieve client campaigns', 500);
        }
    },
};
//# sourceMappingURL=campaign.controller.js.map