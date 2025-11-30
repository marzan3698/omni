import { Response } from 'express';
import { systemSettingService } from '../services/systemSetting.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { z } from 'zod';
import { AuthRequest } from '../types/index.js';

const upsertSettingSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string().min(1, 'Value is required'),
  description: z.string().optional(),
});

const updateSettingSchema = z.object({
  value: z.string().min(1).optional(),
  description: z.string().optional(),
});

export const systemSettingController = {
  upsertSetting: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      const validatedData = upsertSettingSchema.parse(req.body);
      const setting = await systemSettingService.upsertSetting(
        companyId,
        validatedData.key,
        validatedData.value,
        validatedData.description
      );
      return sendSuccess(res, setting, 'System setting created/updated successfully', 201);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      return sendError(res, error.message || 'Failed to create/update system setting', error.statusCode || 500);
    }
  },

  getSettings: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      const settings = await systemSettingService.getSettings(companyId);
      return sendSuccess(res, settings, 'System settings retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve system settings', 500);
    }
  },

  getSettingByKey: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      const key = req.params.key;
      const setting = await systemSettingService.getSettingByKey(companyId, key);
      return sendSuccess(res, setting, 'System setting retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve system setting', error.statusCode || 500);
    }
  },

  updateSetting: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      const key = req.params.key;
      const validatedData = updateSettingSchema.parse(req.body);
      const setting = await systemSettingService.updateSetting(companyId, key, validatedData);
      return sendSuccess(res, setting, 'System setting updated successfully');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      return sendError(res, error.message || 'Failed to update system setting', error.statusCode || 500);
    }
  },

  deleteSetting: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      const key = req.params.key;
      await systemSettingService.deleteSetting(companyId, key);
      return sendSuccess(res, null, 'System setting deleted successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to delete system setting', error.statusCode || 500);
    }
  },
};

