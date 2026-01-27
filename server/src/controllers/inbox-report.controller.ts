import { Response } from 'express';
import { inboxReportService, InboxReportFilters } from '../services/inbox-report.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';

export const inboxReportController = {
  /**
   * Get inbox report data
   * GET /api/admin/inbox-report
   * Query params: startDate, endDate, labelName
   * Permission: SuperAdmin only
   */
  getInboxReport: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      
      // Extract filters from query parameters
      const filters: InboxReportFilters = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        labelName: req.query.labelName as string | undefined,
      };

      // Validate date format if provided
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        if (isNaN(startDate.getTime())) {
          return sendError(res, 'Invalid startDate format. Use YYYY-MM-DD', 400);
        }
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        if (isNaN(endDate.getTime())) {
          return sendError(res, 'Invalid endDate format. Use YYYY-MM-DD', 400);
        }
      }

      // Validate date range
      if (filters.startDate && filters.endDate) {
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        if (startDate > endDate) {
          return sendError(res, 'startDate must be before or equal to endDate', 400);
        }
      }

      const reportData = await inboxReportService.getInboxReport(companyId, filters);
      
      return sendSuccess(res, reportData, 'Inbox report retrieved successfully');
    } catch (error: any) {
      console.error('[Inbox Report Controller] Error:', error);
      return sendError(
        res,
        error.message || 'Failed to retrieve inbox report',
        error.statusCode || 500
      );
    }
  },
};
