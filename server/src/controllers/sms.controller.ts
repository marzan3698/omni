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

            const { token, registrationWelcomeSms } = req.body;
            
            if (token) {
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
            }

            if (registrationWelcomeSms) {
                await prisma.systemSetting.upsert({
                    where: { companyId_key: { companyId, key: 'registration_welcome_sms' } },
                    update: { value: registrationWelcomeSms },
                    create: {
                        companyId,
                        key: 'registration_welcome_sms',
                        value: registrationWelcomeSms,
                        description: 'Welcome SMS template for new registrations'
                    }
                });
            }

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

            const settings = await prisma.systemSetting.findMany({
                where: { 
                    companyId, 
                    key: { in: ['sms_greenweb_token', 'registration_welcome_sms'] } 
                }
            });

            const result = {
                token: settings.find(s => s.key === 'sms_greenweb_token')?.value || '',
                registrationWelcomeSms: settings.find(s => s.key === 'registration_welcome_sms')?.value || ''
            };

            return sendSuccess(res, result, 'SMS settings retrieved');
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
    },

    /**
     * Send Bulk SMS
     * POST /api/sms/bulk
     */
    sendBulkSms: async (req: AuthRequest, res: Response) => {
        try {
            const companyId = req.user?.companyId;
            if (!companyId) return sendError(res, 'Company ID is required', 400);

            const { phones, message } = req.body;
            if (!phones || !Array.isArray(phones) || phones.length === 0) {
                return sendError(res, 'A valid array of destination numbers is required', 400);
            }
            if (!message) return sendError(res, 'Message body is required', 400);

            // Filter out empty/invalid items and strip whitespace
            const validPhones = phones
                .filter((p: any) => typeof p === 'string' && p.trim().length > 5)
                .map((p: string) => p.trim());

            if (validPhones.length === 0) {
                return sendError(res, 'No valid mobile numbers provided', 400);
            }

            // GreenWeb supports comma-separated numbers for bulk sending natively
            const to = validPhones.join(',');

            const result = await smsService.sendSms(companyId, to, message);

            return sendSuccess(res, {
                result,
                count: validPhones.length
            }, `Bulk SMS sent to ${validPhones.length} numbers successfully`);
        } catch (error: any) {
            console.error('Bulk SMS Error:', error.message);
            return sendError(res, error.message || 'Failed to send bulk SMS', 500);
        }
    }
};
