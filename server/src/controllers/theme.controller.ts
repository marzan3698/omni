import { Response } from 'express';
import { themeService } from '../services/theme.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { z } from 'zod';
import { AuthRequest } from '../types/index.js';

const updateThemeSettingsSchema = z.object({
  siteName: z.string().min(1, 'Site name is required').optional(),
  contactEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  contactPhone: z.string().optional().or(z.literal('')),
  contactAddress: z.string().optional().or(z.literal('')),
});

const updateHeroSettingsSchema = z.object({
  title: z.string().max(100, 'Title must be 100 characters or less').optional(),
  subtitle: z.string().max(200, 'Subtitle must be 200 characters or less').optional(),
  trustIndicator: z.string().max(100, 'Trust indicator must be 100 characters or less').optional(),
  backgroundType: z.enum(['image', 'video_youtube', 'video_local', 'gradient']).optional(),
  backgroundVideoYoutube: z.string().url('Invalid YouTube URL').optional().or(z.literal('')),
  ctaPrimaryText: z.string().max(50, 'Primary CTA text must be 50 characters or less').optional(),
  ctaSecondaryText: z.string().max(50, 'Secondary CTA text must be 50 characters or less').optional(),
  buttonStyle: z.enum(['solid', 'outline', 'gradient', 'pill', 'soft-shadow']).optional(),
  buttonPrimaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format').optional(),
  buttonPrimaryTextColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format').optional(),
  buttonSecondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format').optional(),
  buttonSecondaryTextColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format').optional(),
  titleColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format').optional(),
  subtitleColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format').optional(),
  trustIndicatorColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format').optional(),
  overlayColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format').optional(),
  overlayOpacity: z.number().min(0).max(1).optional(),
  textAlignment: z.enum(['left', 'center', 'right']).optional(),
  featureHighlight1: z.string().max(100, 'Feature highlight must be 100 characters or less').optional(),
  featureHighlight2: z.string().max(100, 'Feature highlight must be 100 characters or less').optional(),
  featureHighlight3: z.string().max(100, 'Feature highlight must be 100 characters or less').optional(),
  featureHighlightsAlignment: z.enum(['left', 'center', 'right']).optional(),
  buttonSize: z.enum(['sm', 'md', 'lg', 'xl']).optional(),
  buttonPrimaryIcon: z.string().max(50, 'Icon name must be 50 characters or less').optional().or(z.literal('')),
  buttonSecondaryIcon: z.string().max(50, 'Icon name must be 50 characters or less').optional().or(z.literal('')),
  addonImage: z.string().optional().or(z.literal('')),
  addonImageAlignment: z.enum(['left', 'center', 'right']).optional(),
});

const updateHeaderSettingsSchema = z.object({
  menuAbout: z.string().max(50, 'Menu item text must be 50 characters or less').optional().or(z.literal('')),
  menuServices: z.string().max(50, 'Menu item text must be 50 characters or less').optional().or(z.literal('')),
  menuContact: z.string().max(50, 'Menu item text must be 50 characters or less').optional().or(z.literal('')),
  menuTerms: z.string().max(50, 'Menu item text must be 50 characters or less').optional().or(z.literal('')),
  menuPrivacy: z.string().max(50, 'Menu item text must be 50 characters or less').optional().or(z.literal('')),
  menuSitemap: z.string().max(50, 'Menu item text must be 50 characters or less').optional().or(z.literal('')),
  buttonPrimaryText: z.string().max(50, 'Button text must be 50 characters or less').optional().or(z.literal('')),
  buttonSecondaryText: z.string().max(50, 'Button text must be 50 characters or less').optional().or(z.literal('')),
  backgroundColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format').optional(),
  textColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format').optional(),
  buttonBgColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format').optional(),
  buttonTextColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format').optional(),
  buttonSecondaryBgColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format').optional().or(z.literal('transparent')),
  buttonSecondaryTextColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format').optional(),
  isFixed: z.boolean().optional(),
  isTransparent: z.boolean().optional(),
  logo: z.string().optional().or(z.literal('')),
  logoType: z.enum(['wide', 'with-text']).optional(),
});

const updateColorSettingsSchema = z.object({
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format'),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format'),
});

export const themeController = {
  /**
   * Get theme settings (public endpoint - can be accessed without auth)
   */
  getThemeSettings: async (req: any, res: Response) => {
    try {
      // For public access, use companyId from query or default to 1 (first company)
      // In a multi-tenant system, you might want to get companyId from domain/subdomain
      const companyId = req.user?.companyId || parseInt(req.query.companyId as string) || 1;
      const settings = await themeService.getThemeSettings(companyId);
      return sendSuccess(res, settings, 'Theme settings retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve theme settings', error.statusCode || 500);
    }
  },

  /**
   * Update theme settings
   */
  updateThemeSettings: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      const validatedData = updateThemeSettingsSchema.parse(req.body);
      const settings = await themeService.updateThemeSettings(companyId, validatedData);
      return sendSuccess(res, settings, 'Theme settings updated successfully');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      return sendError(res, error.message || 'Failed to update theme settings', error.statusCode || 500);
    }
  },

  /**
   * Upload logo
   */
  uploadLogo: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;

      if (!req.file) {
        return sendError(res, 'No file uploaded', 400);
      }

      // File path relative to uploads directory
      const filePath = `/uploads/theme/${req.file.filename}`;
      const setting = await themeService.uploadLogo(companyId, filePath);

      return sendSuccess(res, { logoPath: setting.value }, 'Logo uploaded successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to upload logo', error.statusCode || 500);
    }
  },

  /**
   * Get hero settings (public endpoint - can be accessed without auth)
   */
  getHeroSettings: async (req: any, res: Response) => {
    try {
      // For public access, use companyId from query or default to 1 (first company)
      const companyId = req.user?.companyId || parseInt(req.query.companyId as string) || 1;
      const settings = await themeService.getHeroSettings(companyId);
      return sendSuccess(res, settings, 'Hero settings retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve hero settings', error.statusCode || 500);
    }
  },

  /**
   * Update hero settings
   */
  updateHeroSettings: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      const validatedData = updateHeroSettingsSchema.parse(req.body);
      const settings = await themeService.updateHeroSettings(companyId, validatedData);
      return sendSuccess(res, settings, 'Hero settings updated successfully');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      return sendError(res, error.message || 'Failed to update hero settings', error.statusCode || 500);
    }
  },

  /**
   * Upload hero background image
   */
  uploadHeroImage: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;

      if (!req.file) {
        return sendError(res, 'No file uploaded', 400);
      }

      // File path relative to uploads directory
      const filePath = `/uploads/theme/hero/${req.file.filename}`;
      const setting = await themeService.uploadHeroImage(companyId, filePath);

      return sendSuccess(res, { imagePath: setting.value }, 'Hero image uploaded successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to upload hero image', error.statusCode || 500);
    }
  },

  /**
   * Upload hero background video
   */
  uploadHeroVideo: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;

      if (!req.file) {
        return sendError(res, 'No file uploaded', 400);
      }

      // File path relative to uploads directory
      const filePath = `/uploads/theme/hero/${req.file.filename}`;
      const setting = await themeService.uploadHeroVideo(companyId, filePath);

      return sendSuccess(res, { videoPath: setting.value }, 'Hero video uploaded successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to upload hero video', error.statusCode || 500);
    }
  },

  /**
   * Upload hero addon image
   */
  uploadHeroAddonImage: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;

      if (!req.file) {
        return sendError(res, 'No file uploaded', 400);
      }

      // File path relative to uploads directory
      const filePath = `/uploads/theme/hero/${req.file.filename}`;
      const setting = await themeService.uploadHeroAddonImage(companyId, filePath);

      return sendSuccess(res, { imagePath: setting.value }, 'Hero addon image uploaded successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to upload hero addon image', error.statusCode || 500);
    }
  },

  /**
   * Get header settings (public endpoint - can be accessed without auth)
   */
  getHeaderSettings: async (req: any, res: Response) => {
    try {
      // For public access, use companyId from query or default to 1 (first company)
      const companyId = req.user?.companyId || parseInt(req.query.companyId as string) || 1;
      const settings = await themeService.getHeaderSettings(companyId);
      return sendSuccess(res, settings, 'Header settings retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve header settings', error.statusCode || 500);
    }
  },

  /**
   * Update header settings
   */
  updateHeaderSettings: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      const validatedData = updateHeaderSettingsSchema.parse(req.body);
      const settings = await themeService.updateHeaderSettings(companyId, validatedData);
      return sendSuccess(res, settings, 'Header settings updated successfully');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      return sendError(res, error.message || 'Failed to update header settings', error.statusCode || 500);
    }
  },

  /**
   * Upload header logo
   */
  uploadHeaderLogo: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;

      if (!req.file) {
        return sendError(res, 'No file uploaded', 400);
      }

      // File path relative to uploads directory
      const filePath = `/uploads/theme/${req.file.filename}`;
      const setting = await themeService.uploadHeaderLogo(companyId, filePath);

      return sendSuccess(res, { logoPath: setting.value }, 'Header logo uploaded successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to upload header logo', error.statusCode || 500);
    }
  },

  /**
   * Get color settings (public endpoint - can be accessed without auth)
   */
  getColorSettings: async (req: any, res: Response) => {
    try {
      // For public access, use companyId from query or default to 1 (first company)
      const companyId = req.user?.companyId || parseInt(req.query.companyId as string) || 1;
      const settings = await themeService.getColorSettings(companyId);
      return sendSuccess(res, settings, 'Color settings retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve color settings', error.statusCode || 500);
    }
  },

  /**
   * Update color settings
   */
  updateColorSettings: async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      const validatedData = updateColorSettingsSchema.parse(req.body);
      const settings = await themeService.updateColorSettings(companyId, validatedData);
      return sendSuccess(res, settings, 'Color settings updated successfully');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      return sendError(res, error.message || 'Failed to update color settings', error.statusCode || 500);
    }
  },
};

