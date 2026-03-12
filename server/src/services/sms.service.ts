import axios from 'axios';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const smsService = {
    /**
     * Helper to fetch SMS token from system_settings
     */
    async getToken(companyId: number): Promise<string> {
        const setting = await prisma.systemSetting.findFirst({
            where: {
                companyId,
                key: 'sms_greenweb_token'
            }
        });

        if (!setting || !setting.value) {
            throw new AppError('SMS token not configured for this company', 400);
        }

        return setting.value;
    },

    /**
     * Send SMS using GreenWebSMS (bdbulksms.net)
     */
    async sendSms(companyId: number, to: string, message: string) {
        const token = await this.getToken(companyId);

        try {
            const params = new URLSearchParams();
            params.append('token', token);
            params.append('to', to);
            params.append('message', message);

            const response = await axios.post('https://api.bdbulksms.net/api.php', params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            return response.data;
        } catch (error: any) {
            console.error('SMS Send Error:', error.response?.data || error.message);
            throw new AppError('Failed to send SMS', 500);
        }
    }
};
