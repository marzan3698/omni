import { Response } from 'express';
import { facebookOAuthService } from '../services/facebookOAuth.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';

export const facebookOAuthController = {
  /**
   * Get OAuth authorization URL
   * GET /api/integrations/facebook/auth-url
   */
  getAuthUrl: async (req: AuthRequest, res: Response) => {
    try {
      const user = (req as AuthRequest).user;
      if (!user || !user.companyId) {
        return sendError(res, 'User not authenticated', 401);
      }

      const { url, state } = facebookOAuthService.getAuthUrl(user.id, user.companyId);
      return sendSuccess(res, { url, state }, 'OAuth URL generated successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to generate OAuth URL', error.statusCode || 500);
    }
  },

  /**
   * Handle OAuth callback from Facebook
   * GET /api/integrations/facebook/callback
   */
  handleCallback: async (req: any, res: Response) => {
    try {
      const { code, state, error, error_reason, error_description } = req.query;

      // Handle OAuth errors
      if (error) {
        const errorMessage = error_description || error_reason || 'OAuth authorization failed';
        // Redirect to frontend with error
        const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/facebook-oauth-callback?error=${encodeURIComponent(errorMessage)}`);
      }

      if (!code || !state) {
        const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/facebook-oauth-callback?error=${encodeURIComponent('Missing code or state parameter')}`);
      }

      // Exchange code for token and get pages
      const { userAccessToken, companyId } = await facebookOAuthService.exchangeCodeForToken(code, state);
      const pages = await facebookOAuthService.getUserPages(userAccessToken);

      // Redirect to frontend with pages data
      const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const pagesData = encodeURIComponent(JSON.stringify(pages));
      const tokenData = encodeURIComponent(JSON.stringify({ userAccessToken, companyId }));

      return res.redirect(
        `${frontendUrl}/facebook-oauth-callback?pages=${pagesData}&token=${tokenData}`
      );
    } catch (error: any) {
      const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const errorMessage = error.message || 'Failed to process OAuth callback';
      return res.redirect(`${frontendUrl}/facebook-oauth-callback?error=${encodeURIComponent(errorMessage)}`);
    }
  },

  /**
   * Connect a Facebook page
   * POST /api/integrations/facebook/connect-page
   */
  connectPage: async (req: AuthRequest, res: Response) => {
    try {
      const user = (req as AuthRequest).user;
      if (!user || !user.companyId) {
        return sendError(res, 'User not authenticated', 401);
      }

      const { pageId, pageName, pageAccessToken } = req.body;

      if (!pageId || !pageName || !pageAccessToken) {
        return sendError(res, 'Page ID, name, and access token are required', 400);
      }

      // Connect the page (creates/updates integration and subscribes to webhooks)
      const integration = await facebookOAuthService.connectPage(
        user.companyId,
        pageId,
        pageName,
        pageAccessToken
      );

      return sendSuccess(res, integration, 'Facebook page connected successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to connect page', error.statusCode || 500);
    }
  },
};
