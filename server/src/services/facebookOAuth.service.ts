import axios from 'axios';
import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';
import crypto from 'crypto';

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const FACEBOOK_OAUTH_REDIRECT_URI = process.env.FACEBOOK_OAUTH_REDIRECT_URI || 'http://localhost:5001/api/integrations/facebook/callback';
const FACEBOOK_CONFIG_ID = process.env.FACEBOOK_CONFIG_ID; // Optional: Facebook Login for Business configuration ID
const FACEBOOK_GRAPH_API_VERSION = 'v18.0';

// Store OAuth state and temporary tokens (in production, use Redis or database)
const oauthStateStore = new Map<string, { userId: number; companyId: number; expiresAt: Date }>();
const tempTokenStore = new Map<string, { userAccessToken: string; companyId: number; expiresAt: Date }>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = new Date();
  for (const [key, value] of oauthStateStore.entries()) {
    if (value.expiresAt < now) {
      oauthStateStore.delete(key);
    }
  }
  for (const [key, value] of tempTokenStore.entries()) {
    if (value.expiresAt < now) {
      tempTokenStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const facebookOAuthService = {
  /**
   * Generate Facebook OAuth URL
   */
  getAuthUrl(userId: number, companyId: number): { url: string; state: string } {
    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      throw new AppError('Facebook App ID and Secret must be configured', 500);
    }

    // Generate secure state parameter for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store state with user info
    oauthStateStore.set(state, { userId, companyId, expiresAt });

    // Required permissions
    const scopes = [
      'pages_show_list',      // List user's pages
      'pages_messaging',       // Send/receive messages
      'pages_manage_metadata', // Subscribe to webhooks
    ].join(',');

    let authUrl = `https://www.facebook.com/${FACEBOOK_GRAPH_API_VERSION}/dialog/oauth?` +
      `client_id=${FACEBOOK_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(FACEBOOK_OAUTH_REDIRECT_URI)}&` +
      `scope=${scopes}&` +
      `state=${state}&` +
      `response_type=code`;
    if (FACEBOOK_CONFIG_ID) {
      authUrl += `&config_id=${FACEBOOK_CONFIG_ID}`;
    }

    return { url: authUrl, state };
  },

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, state: string): Promise<{ userAccessToken: string; companyId: number }> {
    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      throw new AppError('Facebook App ID and Secret must be configured', 500);
    }

    // Verify state
    const stateData = oauthStateStore.get(state);
    if (!stateData) {
      throw new AppError('Invalid or expired OAuth state', 400);
    }

    // Check if state expired
    if (stateData.expiresAt < new Date()) {
      oauthStateStore.delete(state);
      throw new AppError('OAuth state expired', 400);
    }

    const { companyId } = stateData;

    try {
      // Exchange code for short-lived access token
      const tokenResponse = await axios.get(
        `https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}/oauth/access_token`,
        {
          params: {
            client_id: FACEBOOK_APP_ID,
            client_secret: FACEBOOK_APP_SECRET,
            redirect_uri: FACEBOOK_OAUTH_REDIRECT_URI,
            code,
          },
        }
      );

      const { access_token: shortLivedToken, expires_in } = tokenResponse.data;

      if (!shortLivedToken) {
        throw new AppError('Failed to get access token from Facebook', 500);
      }

      // Exchange short-lived token for long-lived token (60 days)
      const longLivedResponse = await axios.get(
        `https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}/oauth/access_token`,
        {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: FACEBOOK_APP_ID,
            client_secret: FACEBOOK_APP_SECRET,
            fb_exchange_token: shortLivedToken,
          },
        }
      );

      const { access_token: longLivedToken } = longLivedResponse.data;

      if (!longLivedToken) {
        throw new AppError('Failed to exchange for long-lived token', 500);
      }

      // Store token temporarily (expires in 1 hour)
      const tempKey = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      tempTokenStore.set(tempKey, { userAccessToken: longLivedToken, companyId, expiresAt });

      // Clean up state
      oauthStateStore.delete(state);

      return { userAccessToken: longLivedToken, companyId };
    } catch (error: any) {
      if (error.response?.data) {
        throw new AppError(
          error.response.data.error?.message || 'Failed to exchange code for token',
          error.response.status || 500
        );
      }
      throw new AppError('Failed to exchange code for token', 500);
    }
  },

  /**
   * Get user's Facebook pages
   */
  async getUserPages(userAccessToken: string): Promise<Array<{ id: string; name: string; access_token: string }>> {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}/me/accounts`,
        {
          params: {
            access_token: userAccessToken,
            fields: 'id,name,access_token',
          },
        }
      );

      const pages = response.data.data || [];
      return pages.map((page: any) => ({
        id: page.id,
        name: page.name,
        access_token: page.access_token,
      }));
    } catch (error: any) {
      if (error.response?.data) {
        throw new AppError(
          error.response.data.error?.message || 'Failed to get user pages',
          error.response.status || 500
        );
      }
      throw new AppError('Failed to get user pages', 500);
    }
  },

  /**
   * Get long-lived page access token
   */
  async getPageAccessToken(pageId: string, userAccessToken: string): Promise<string> {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}/${pageId}`,
        {
          params: {
            fields: 'access_token',
            access_token: userAccessToken,
          },
        }
      );

      const pageAccessToken = response.data.access_token;

      if (!pageAccessToken) {
        throw new AppError('Failed to get page access token', 500);
      }

      return pageAccessToken;
    } catch (error: any) {
      if (error.response?.data) {
        throw new AppError(
          error.response.data.error?.message || 'Failed to get page access token',
          error.response.status || 500
        );
      }
      throw new AppError('Failed to get page access token', 500);
    }
  },

  /**
   * Subscribe page to app webhooks
   */
  async subscribePageToWebhook(pageId: string, pageAccessToken: string): Promise<void> {
    if (!FACEBOOK_APP_ID) {
      throw new AppError('Facebook App ID must be configured', 500);
    }

    try {
      // Subscribe page to app
      await axios.post(
        `https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}/${pageId}/subscribed_apps`,
        {},
        {
          params: {
            access_token: pageAccessToken,
            subscribed_fields: 'messages,messaging_postbacks,messaging_optins,messaging_deliveries,messaging_reads',
          },
        }
      );
    } catch (error: any) {
      if (error.response?.data) {
        // If already subscribed, that's okay
        if (error.response.data.error?.code === 200) {
          return;
        }
        throw new AppError(
          error.response.data.error?.message || 'Failed to subscribe page to webhook',
          error.response.status || 500
        );
      }
      throw new AppError('Failed to subscribe page to webhook', 500);
    }
  },

  /**
   * Connect a Facebook page (create integration)
   */
  async connectPage(
    companyId: number,
    pageId: string,
    pageName: string,
    pageAccessToken: string
  ) {
    // Subscribe page to webhooks
    await this.subscribePageToWebhook(pageId, pageAccessToken);

    // Check if integration already exists
    const existing = await prisma.integration.findFirst({
      where: {
        companyId,
        provider: 'facebook',
        pageId,
      },
    });

    if (existing) {
      // Update existing integration
      return await prisma.integration.update({
        where: { id: existing.id },
        data: {
          accessToken: pageAccessToken,
          isActive: true,
        },
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
      });
    }

    // Create new integration
    return await prisma.integration.create({
      data: {
        companyId,
        provider: 'facebook',
        pageId,
        accessToken: pageAccessToken,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });
  },
};
