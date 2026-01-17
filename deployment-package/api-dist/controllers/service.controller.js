import { serviceService } from '../services/service.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
// Validation schemas
const createServiceSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    details: z.string().min(1, 'Details are required'),
    pricing: z.number().positive('Pricing must be greater than 0'),
    deliveryStartDate: z.string().transform((str) => new Date(str)),
    deliveryEndDate: z.string().transform((str) => new Date(str)),
    attributes: z.object({
        keyValuePairs: z.record(z.string()).optional(),
        tags: z.array(z.string()).optional(),
    }).optional(),
});
const updateServiceSchema = z.object({
    title: z.string().min(1).optional(),
    details: z.string().min(1).optional(),
    pricing: z.number().positive().optional(),
    deliveryStartDate: z.string().transform((str) => new Date(str)).optional(),
    deliveryEndDate: z.string().transform((str) => new Date(str)).optional(),
    attributes: z.object({
        keyValuePairs: z.record(z.string()).optional(),
        tags: z.array(z.string()).optional(),
    }).optional(),
    isActive: z.boolean().optional(),
});
export const serviceController = {
    /**
     * Create a new service
     * POST /api/services
     */
    createService: async (req, res) => {
        try {
            const companyId = req.user?.companyId;
            if (!companyId) {
                return sendError(res, 'Company ID is required', 400);
            }
            const validatedData = createServiceSchema.parse(req.body);
            const service = await serviceService.createService({
                ...validatedData,
                companyId,
                attributes: validatedData.attributes || { keyValuePairs: {}, tags: [] },
            });
            return sendSuccess(res, service, 'Service created successfully', 201);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to create service', 500);
        }
    },
    /**
     * Get all services
     * GET /api/services
     */
    getAllServices: async (req, res) => {
        try {
            const companyId = req.user?.companyId;
            if (!companyId) {
                return sendError(res, 'Company ID is required', 400);
            }
            const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
            const services = await serviceService.getAllServices(companyId, { isActive });
            return sendSuccess(res, services, 'Services retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to retrieve services', 500);
        }
    },
    /**
     * Get service by ID
     * GET /api/services/:id
     */
    getServiceById: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const companyId = req.user?.companyId;
            if (isNaN(id)) {
                return sendError(res, 'Invalid service ID', 400);
            }
            if (!companyId) {
                return sendError(res, 'Company ID is required', 400);
            }
            const service = await serviceService.getServiceById(id, companyId);
            return sendSuccess(res, service, 'Service retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to retrieve service', 500);
        }
    },
    /**
     * Update service
     * PUT /api/services/:id
     */
    updateService: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const companyId = req.user?.companyId;
            if (isNaN(id)) {
                return sendError(res, 'Invalid service ID', 400);
            }
            if (!companyId) {
                return sendError(res, 'Company ID is required', 400);
            }
            const validatedData = updateServiceSchema.parse(req.body);
            const service = await serviceService.updateService(id, companyId, validatedData);
            return sendSuccess(res, service, 'Service updated successfully');
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to update service', 500);
        }
    },
    /**
     * Delete service
     * DELETE /api/services/:id
     */
    deleteService: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const companyId = req.user?.companyId;
            if (isNaN(id)) {
                return sendError(res, 'Invalid service ID', 400);
            }
            if (!companyId) {
                return sendError(res, 'Company ID is required', 400);
            }
            await serviceService.deleteService(id, companyId);
            return sendSuccess(res, null, 'Service deleted successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to delete service', 500);
        }
    },
};
//# sourceMappingURL=service.controller.js.map