import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
export const systemSettingService = {
    /**
     * Create or update system setting
     */
    async upsertSetting(companyId, key, value, description) {
        const setting = await prisma.systemSetting.upsert({
            where: {
                companyId_key: {
                    companyId,
                    key,
                },
            },
            update: {
                value,
                ...(description && { description }),
            },
            create: {
                companyId,
                key,
                value,
                description,
            },
        });
        return setting;
    },
    /**
     * Get all system settings for a company
     */
    async getSettings(companyId) {
        const settings = await prisma.systemSetting.findMany({
            where: { companyId },
            orderBy: { key: 'asc' },
        });
        return settings;
    },
    /**
     * Get setting by key
     */
    async getSettingByKey(companyId, key) {
        const setting = await prisma.systemSetting.findUnique({
            where: {
                companyId_key: {
                    companyId,
                    key,
                },
            },
        });
        if (!setting) {
            throw new AppError('System setting not found', 404);
        }
        return setting;
    },
    /**
     * Update system setting
     */
    async updateSetting(companyId, key, data) {
        await this.getSettingByKey(companyId, key); // Verify exists
        const setting = await prisma.systemSetting.update({
            where: {
                companyId_key: {
                    companyId,
                    key,
                },
            },
            data: {
                ...(data.value && { value: data.value }),
                ...(data.description !== undefined && { description: data.description }),
            },
        });
        return setting;
    },
    /**
     * Delete system setting
     */
    async deleteSetting(companyId, key) {
        await this.getSettingByKey(companyId, key); // Verify exists
        await prisma.systemSetting.delete({
            where: {
                companyId_key: {
                    companyId,
                    key,
                },
            },
        });
        return { success: true };
    },
};
//# sourceMappingURL=systemSetting.service.js.map