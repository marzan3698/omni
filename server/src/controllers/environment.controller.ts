import { Response } from 'express';
import { environmentService } from '../services/environment.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import { z } from 'zod';

// Validation schema for Facebook config
const facebookConfigSchema = z.object({
  FACEBOOK_APP_ID: z.string().min(1, 'Facebook App ID is required').regex(/^\d+$/, 'Facebook App ID must be numeric'),
  FACEBOOK_APP_SECRET: z.string().min(1, 'Facebook App Secret is required'),
  FACEBOOK_VERIFY_TOKEN: z.string().min(1, 'Facebook Verify Token is required'),
  FACEBOOK_OAUTH_REDIRECT_URI: z.string().url('Invalid URL format for OAuth Redirect URI'),
});

export const environmentController = {
  /**
   * Get Facebook webhook configuration
   * GET /api/admin/environment/facebook-config
   */
  getFacebookConfig: async (_req: AuthRequest, res: Response) => {
    try {
      console.log('[Environment Controller] Getting Facebook config...');
      const config = environmentService.readFacebookConfig();
      console.log('[Environment Controller] Config retrieved successfully');
      return sendSuccess(res, config, 'Facebook configuration retrieved successfully');
    } catch (error: any) {
      console.error('[Environment Controller] Error:', error);
      return sendError(res, error.message || 'Failed to read Facebook configuration', error.statusCode || 500);
    }
  },

  /**
   * Update Facebook webhook configuration
   * PUT /api/admin/environment/facebook-config
   */
  updateFacebookConfig: async (req: AuthRequest, res: Response) => {
    try {
      // Validate input
      const validatedData = facebookConfigSchema.parse(req.body);
      
      // Update configuration
      const result = await environmentService.updateFacebookConfig(validatedData);
      
      return sendSuccess(res, result, result.message);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return sendError(res, error.errors[0].message, 400);
      }
      return sendError(res, error.message || 'Failed to update Facebook configuration', error.statusCode || 500);
    }
  },

  /**
   * Get webhook URLs for current deployment (domain-agnostic)
   * GET /api/admin/environment/webhook-urls
   * Used by Super Admin to copy URLs into Facebook App (Callback URL, Verify Token, OAuth Redirect URI).
   */
  getWebhookUrls: async (req: AuthRequest, res: Response) => {
    try {
      const config = environmentService.readFacebookConfig();
      // Resolve base URL: env (for auto-deploy/domain) or request host
      const fromEnv =
        process.env.API_URL ||
        process.env.PUBLIC_URL ||
        process.env.NGROK_URL ||
        process.env.BASE_URL ||
        '';
      const fromRequest =
        `${req.get('x-forwarded-proto') || req.protocol}://${req.get('x-forwarded-host') || req.get('host') || ''}`.replace(
          /\/$/,
          ''
        );
      const baseUrl = (fromEnv ? fromEnv.replace(/\/$/, '') : fromRequest) || 'https://your-domain.com';

      const data = {
        baseUrl,
        webhookCallbackUrl: `${baseUrl}/api/webhooks/facebook`,
        oauthRedirectUri: `${baseUrl}/api/integrations/facebook/callback`,
        verifyToken: config.FACEBOOK_VERIFY_TOKEN || '',
      };
      return sendSuccess(res, data, 'Webhook URLs retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to get webhook URLs', error.statusCode || 500);
    }
  },
};
