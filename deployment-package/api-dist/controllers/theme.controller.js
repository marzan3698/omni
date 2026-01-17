import { themeService } from '../services/theme.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { z } from 'zod';
const updateThemeSettingsSchema = z.object({
    siteName: z.string().min(1, 'Site name is required').optional(),
    contactEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
    contactPhone: z.string().optional().or(z.literal('')),
    contactAddress: z.string().optional().or(z.literal('')),
});
export const themeController = {
    /**
     * Get theme settings (public endpoint - can be accessed without auth)
     */
    getThemeSettings: async (req, res) => {
        try {
            // For public access, use companyId from query or default to 1 (first company)
            // In a multi-tenant system, you might want to get companyId from domain/subdomain
            const companyId = req.user?.companyId || parseInt(req.query.companyId) || 1;
            const settings = await themeService.getThemeSettings(companyId);
            return sendSuccess(res, settings, 'Theme settings retrieved successfully');
        }
        catch (error) {
            return sendError(res, error.message || 'Failed to retrieve theme settings', error.statusCode || 500);
        }
    },
    /**
     * Update theme settings
     */
    updateThemeSettings: async (req, res) => {
        try {
            const companyId = req.user.companyId;
            const validatedData = updateThemeSettingsSchema.parse(req.body);
            const settings = await themeService.updateThemeSettings(companyId, validatedData);
            return sendSuccess(res, settings, 'Theme settings updated successfully');
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            return sendError(res, error.message || 'Failed to update theme settings', error.statusCode || 500);
        }
    },
    /**
     * Upload logo
     */
    uploadLogo: async (req, res) => {
        try {
            const companyId = req.user.companyId;
            if (!req.file) {
                return sendError(res, 'No file uploaded', 400);
            }
            // File path relative to uploads directory
            const filePath = `/uploads/theme/${req.file.filename}`;
            const setting = await themeService.uploadLogo(companyId, filePath);
            return sendSuccess(res, { logoPath: setting.value }, 'Logo uploaded successfully');
        }
        catch (error) {
            return sendError(res, error.message || 'Failed to upload logo', error.statusCode || 500);
        }
    },
};
//# sourceMappingURL=theme.controller.js.map