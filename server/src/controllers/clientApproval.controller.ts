import { Request, Response } from 'express';
import { clientApprovalService } from '../services/clientApproval.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../types/index.js';

export const clientApprovalController = {
  async getPending(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const companyId = authReq.user?.companyId;

      if (!companyId) {
        return sendError(res, 'Company ID is required', 400);
      }

      const list = await clientApprovalService.getPending(companyId);
      return sendSuccess(res, list, 'Pending client approvals retrieved');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      console.error('getPending error:', error);
      return sendError(res, 'Failed to get pending approvals', 500);
    }
  },

  async approve(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;
      const companyId = authReq.user?.companyId;

      if (!userId || !companyId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return sendError(res, 'Invalid request ID', 400);
      }

      const result = await clientApprovalService.approve(id, companyId, userId);
      return sendSuccess(res, result, 'Client approved. Account created; client can now login.');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      return sendError(res, 'Failed to approve client', 500);
    }
  },
};
