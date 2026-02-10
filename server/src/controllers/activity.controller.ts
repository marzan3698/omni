import { Response, NextFunction } from 'express';
import { z } from 'zod';
import * as activityService from '../services/activity.service.js';
import type { LogActivityInput } from '../services/activity.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';

const logActivitySchema = z.object({
  mouseClicks: z.number().int().min(0),
  mouseMovements: z.number().int().min(0),
  keystrokes: z.number().int().min(0),
  intervalStart: z.string().datetime(),
  intervalEnd: z.string().datetime(),
  sessionId: z.number().int().positive().optional().nullable(),
});

export const activityController = {
  log: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      if (!userId || companyId == null) {
        return sendError(res, 'Authentication required', 401);
      }
      const parsed = logActivitySchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, 'Invalid activity payload', 400);
      }
      await activityService.logActivity(userId, companyId, parsed.data as LogActivityInput);
      sendSuccess(res, { ok: true }, 'Activity logged', 201);
    } catch (error) {
      next(error);
    }
  },

  uploadScreenshot: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      if (!userId || companyId == null) {
        return sendError(res, 'Authentication required', 401);
      }
      const file = (req as any).file;
      if (!file?.filename) {
        return sendError(res, 'Screenshot file required', 400);
      }
      const imageUrl = `/uploads/screenshots/${file.filename}`;
      const pageUrl = (req.body?.pageUrl as string) || null;
      const sessionId = req.body?.sessionId
        ? parseInt(String(req.body.sessionId), 10)
        : null;
      const validSessionId = Number.isInteger(sessionId) ? sessionId : null;
      const result = await activityService.saveScreenshot(
        userId,
        companyId,
        imageUrl,
        pageUrl,
        validSessionId
      );
      sendSuccess(res, result, 'Screenshot saved', 201);
    } catch (error) {
      next(error);
    }
  },

  getEmployeeSummaries: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (companyId == null) {
        return sendError(res, 'Authentication required', 401);
      }
      const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
      const data = await activityService.getEmployeeSummaries(date, companyId);
      sendSuccess(res, data, 'Employee summaries');
    } catch (error) {
      next(error);
    }
  },

  getEmployeeDetail: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (companyId == null) {
        return sendError(res, 'Authentication required', 401);
      }
      const userId = req.params.userId;
      const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
      const data = await activityService.getEmployeeDetail(userId, date, companyId);
      if (!data) {
        return sendError(res, 'Employee not found', 404);
      }
      sendSuccess(res, data, 'Employee detail');
    } catch (error) {
      next(error);
    }
  },

  getEmployeeScreenshots: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (companyId == null) {
        return sendError(res, 'Authentication required', 401);
      }
      const userId = req.params.userId;
      const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
      const page = Math.max(1, parseInt(String(req.query.page || 1), 10));
      const data = await activityService.getEmployeeScreenshots(
        userId,
        date,
        page,
        companyId
      );
      sendSuccess(res, data, 'Screenshots');
    } catch (error) {
      next(error);
    }
  },
};
