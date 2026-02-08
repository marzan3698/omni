import { Request, Response } from 'express';
import { getBusyEmployeeIds } from '../services/booking.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../types/index.js';

/**
 * GET /api/bookings/availability
 * Query: companyId, startTime (ISO), durationMinutes, optional excludeCallId, excludeMeetingId
 * Returns { busyEmployeeIds: number[] } for the given slot.
 */
export async function getAvailability(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const companyId = parseInt(
      (req.query.companyId as string) || String(authReq.user?.companyId || '')
    );
    const startTimeRaw = req.query.startTime as string;
    const durationMinutes = parseInt(req.query.durationMinutes as string);
    const excludeCallId = req.query.excludeCallId
      ? parseInt(req.query.excludeCallId as string)
      : undefined;
    const excludeMeetingId = req.query.excludeMeetingId
      ? parseInt(req.query.excludeMeetingId as string)
      : undefined;

    if (isNaN(companyId) || !companyId) {
      return sendError(res, 'companyId is required', 400);
    }
    if (!startTimeRaw) {
      return sendError(res, 'startTime is required', 400);
    }
    const startTime = new Date(startTimeRaw);
    if (Number.isNaN(startTime.getTime())) {
      return sendError(res, 'Invalid startTime', 400);
    }
    if (isNaN(durationMinutes) || durationMinutes < 1) {
      return sendError(res, 'durationMinutes is required and must be positive', 400);
    }

    const busyEmployeeIds = await getBusyEmployeeIds({
      companyId,
      startTime,
      durationMinutes,
      excludeCallId: isNaN(excludeCallId as number) ? undefined : excludeCallId,
      excludeMeetingId: isNaN(excludeMeetingId as number) ? undefined : excludeMeetingId,
    });

    return sendSuccess(res, { busyEmployeeIds }, 'Availability retrieved');
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, 'Failed to get availability', 500);
  }
}
