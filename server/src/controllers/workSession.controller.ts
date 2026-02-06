import { Request, Response, NextFunction } from 'express';
import * as workSessionService from '../services/workSession.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const workSessionController = {
  toggleLiveStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const companyId = (req as any).user?.companyId;
      if (!userId || !companyId) {
        return sendError(res, 'Authentication required', 401);
      }
      const result = await workSessionService.toggleLiveStatus(userId, companyId);
      sendSuccess(res, result, 'Live status updated');
    } catch (error) {
      next(error);
    }
  },

  getCurrentSession: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return sendError(res, 'Authentication required', 401);
      }
      const result = await workSessionService.getCurrentSession(userId);
      sendSuccess(res, result, 'Current session retrieved');
    } catch (error) {
      next(error);
    }
  },

  getWorkHistory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const companyId = (req as any).user?.companyId;
      if (!userId || !companyId) {
        return sendError(res, 'Authentication required', 401);
      }
      const daysParam = req.query.days;
      const days = daysParam ? parseInt(String(daysParam), 10) : 7;
      const result = await workSessionService.getWorkHistory(userId, companyId, days);
      sendSuccess(res, result, 'Work history retrieved');
    } catch (error) {
      next(error);
    }
  },
};
