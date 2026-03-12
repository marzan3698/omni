import { Response } from 'express';
import { smsService } from '../services/sms.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import { prisma } from '../lib/prisma.js';

export const smsController = {
    /**
     * Save SMS Token Config
     * POST /api/sms/settings
     */
    saveSettings: async (req: AuthRequest, res: Response) => {
        try {
            const companyId = req.user?.companyId;
            if (!companyId) return sendError(res, 'Company ID is required', 400);

            const { token } = req.body;
            if (!token) return sendError(res, 'SMS Token is required', 400);

            await prisma.systemSetting.upsert({
                where: { companyId_key: { companyId, key: 'sms_greenweb_token' } },
                update: { value: token },
                create: {
                    companyId,
                    key: 'sms_greenweb_token',
                    value: token,
                    description: 'GreenWeb SMS API Token'
                }
            });

            return sendSuccess(res, null, 'SMS settings saved successfully');
        } catch (error: any) {
            console.error('Save SMS Settings Error:', error);
            return sendError(res, 'Failed to save SMS settings', 500);
        }
    },

    /**
     * Get SMS Settings
     * GET /api/sms/settings
     */
    getSettings: async (req: AuthRequest, res: Response) => {
        try {
            const companyId = req.user?.companyId;
            if (!companyId) return sendError(res, 'Company ID is required', 400);

            const setting = await prisma.systemSetting.findFirst({
                where: { companyId, key: 'sms_greenweb_token' }
            });

            return sendSuccess(res, { token: setting?.value || '' }, 'SMS settings retrieved');
        } catch (error: any) {
            return sendError(res, 'Failed to retrieve SMS settings', 500);
        }
    },

    /**
     * Send Test SMS
     * POST /api/sms/test
     */
    sendTestSms: async (req: AuthRequest, res: Response) => {
        try {
            const companyId = req.user?.companyId;
            if (!companyId) return sendError(res, 'Company ID is required', 400);

            const { to, message } = req.body;
            if (!to || !message) return sendError(res, 'Destination number and message are required', 400);

            const result = await smsService.sendSms(companyId, to, message);

            return sendSuccess(res, result, 'Test SMS sent successfully');
        } catch (error: any) {
            console.error('Test SMS Error:', error.message);
            return sendError(res, error.message || 'Failed to send test SMS', 500);
        }
    }
};
