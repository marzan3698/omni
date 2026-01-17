import { reviewService } from '../services/review.service.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
export const reviewController = {
    async getPublic(req, res, next) {
        try {
            const companyIdParam = req.query.companyId ? parseInt(req.query.companyId, 10) : undefined;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 6;
            const reviews = await reviewService.getPublicReviews(companyIdParam, limit);
            sendSuccess(res, reviews, 'Reviews retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    },
    async list(req, res, next) {
        try {
            const companyId = req.user?.companyId;
            const reviews = await reviewService.list(companyId);
            sendSuccess(res, reviews, 'Reviews retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    },
    async create(req, res, next) {
        try {
            const companyId = req.user?.companyId;
            const review = await reviewService.create({ ...req.body, companyId });
            sendSuccess(res, review, 'Review created successfully', 201);
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            next(error);
        }
    },
    async update(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            const companyId = req.user?.companyId;
            if (isNaN(id)) {
                return sendError(res, 'Invalid review ID', 400);
            }
            const review = await reviewService.update(id, req.body, companyId);
            sendSuccess(res, review, 'Review updated successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            next(error);
        }
    },
    async remove(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            const companyId = req.user?.companyId;
            if (isNaN(id)) {
                return sendError(res, 'Invalid review ID', 400);
            }
            await reviewService.remove(id, companyId);
            sendSuccess(res, null, 'Review deleted successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            next(error);
        }
    },
};
//# sourceMappingURL=review.controller.js.map