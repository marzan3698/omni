import { Request, Response } from 'express';
import { leadImportService } from '../services/leadImport.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../types/index.js';
import fs from 'fs';

export const leadImportController = {
  /**
   * GET /api/leads/excel/template
   * Download lead import template
   */
  downloadTemplate: async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const companyId = authReq.user?.companyId;
      if (!companyId) return sendError(res, 'User not authenticated', 401);
      const buffer = await leadImportService.generateTemplate(companyId);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="omni-lead-import-template.xlsx"');
      res.send(buffer);
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      const err = error as Error;
      const msg = err?.message || (typeof err === 'string' ? err : 'Failed to generate template');
      const details = err?.stack || (typeof err === 'object' && err !== null ? JSON.stringify(err) : undefined);
      sendError(res, msg, 500, details);
    }
  },

  /**
   * POST /api/leads/excel/import
   * Import leads from Excel file
   */
  importFromExcel: async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;
      const companyId = authReq.user?.companyId;

      if (!userId || !companyId) {
        return sendError(res, 'User not authenticated', 401);
      }

      const file = (req as any).file;
      if (!file || !file.path) {
        return sendError(res, 'No file uploaded', 400);
      }

      const fileName = file.originalname || file.filename || 'import.xlsx';

      const result = await leadImportService.importLeadsFromExcel(
        file.path,
        companyId,
        userId,
        fileName
      );

      // Clean up uploaded file
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch {
        // Ignore cleanup errors
      }

      return sendSuccess(res, result, 'Lead import completed');
    } catch (error) {
      const file = (req as any).file;
      if (file?.path) {
        try {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        } catch {
          // Ignore
        }
      }
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      const err = error as Error;
      const msg = err?.message || (typeof err === 'string' ? err : 'Failed to import leads');
      const details = err?.stack || (typeof err === 'object' && err !== null ? JSON.stringify(err) : undefined);
      sendError(res, msg, 500, details);
    }
  },
};
