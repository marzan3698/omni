import { prisma } from '../lib/prisma.js';
export const themeService = {
    /**
     * Get all theme-related settings for a company
     */
    async getThemeSettings(companyId) {
        const settings = await prisma.systemSetting.findMany({
            where: {
                companyId,
                key: {
                    in: ['site_logo', 'site_name', 'contact_email', 'contact_phone', 'contact_address'],
                },
            },
        });
        // Convert array to object for easier access
        const settingsMap = {};
        settings.forEach((setting) => {
            settingsMap[setting.key] = setting.value;
        });
        return {
            siteLogo: settingsMap['site_logo'] || null,
            siteName: settingsMap['site_name'] || 'Omni CRM',
            contactEmail: settingsMap['contact_email'] || '',
            contactPhone: settingsMap['contact_phone'] || '',
            contactAddress: settingsMap['contact_address'] || '',
        };
    },
    /**
     * Update theme settings
     */
    async updateThemeSettings(companyId, data) {
        const updates = [];
        if (data.siteName !== undefined) {
            updates.push(prisma.systemSetting.upsert({
                where: {
                    companyId_key: {
                        companyId,
                        key: 'site_name',
                    },
                },
                update: { value: data.siteName },
                create: {
                    companyId,
                    key: 'site_name',
                    value: data.siteName,
                    description: 'Site name displayed in header and footer',
                },
            }));
        }
        if (data.contactEmail !== undefined) {
            updates.push(prisma.systemSetting.upsert({
                where: {
                    companyId_key: {
                        companyId,
                        key: 'contact_email',
                    },
                },
                update: { value: data.contactEmail },
                create: {
                    companyId,
                    key: 'contact_email',
                    value: data.contactEmail,
                    description: 'Contact email address',
                },
            }));
        }
        if (data.contactPhone !== undefined) {
            updates.push(prisma.systemSetting.upsert({
                where: {
                    companyId_key: {
                        companyId,
                        key: 'contact_phone',
                    },
                },
                update: { value: data.contactPhone },
                create: {
                    companyId,
                    key: 'contact_phone',
                    value: data.contactPhone,
                    description: 'Contact phone number',
                },
            }));
        }
        if (data.contactAddress !== undefined) {
            updates.push(prisma.systemSetting.upsert({
                where: {
                    companyId_key: {
                        companyId,
                        key: 'contact_address',
                    },
                },
                update: { value: data.contactAddress },
                create: {
                    companyId,
                    key: 'contact_address',
                    value: data.contactAddress,
                    description: 'Contact address',
                },
            }));
        }
        await Promise.all(updates);
        return this.getThemeSettings(companyId);
    },
    /**
     * Handle logo upload and save path
     */
    async uploadLogo(companyId, filePath) {
        // Save logo path to system settings
        const setting = await prisma.systemSetting.upsert({
            where: {
                companyId_key: {
                    companyId,
                    key: 'site_logo',
                },
            },
            update: { value: filePath },
            create: {
                companyId,
                key: 'site_logo',
                value: filePath,
                description: 'Site logo file path',
            },
        });
        return setting;
    },
};
//# sourceMappingURL=theme.service.js.map