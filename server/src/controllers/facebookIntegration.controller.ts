import { Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import { getPublicBaseUrl } from '../utils/publicBaseUrl.js';
import * as facebookAppConfig from '../services/facebookAppConfig.service.js';
import * as facebookIntegration from '../services/facebookIntegration.service.js';

function getCompanyId(req: AuthRequest, queryCompanyId?: string): number | null {
  const user = req.user;
  if (!user?.companyId) return null;
  if (user.role?.name === 'SuperAdmin' && queryCompanyId) {
    const n = parseInt(queryCompanyId, 10);
    if (!isNaN(n)) return n;
  }
  return user.companyId;
}

export const facebookConfigController = {
  getConfig: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = getCompanyId(req, req.query.companyId as string);
      if (companyId == null) return sendError(res, 'Company context required', 401);
      const config = await facebookAppConfig.getConfig(companyId);
      if (!config) return sendSuccess(res, null, 'No config');
      return sendSuccess(res, {
        appId: config.appId,
        verifyToken: config.verifyToken,
        redirectUriOverride: config.redirectUriOverride,
        hasAppSecret: !!config.appSecret,
      }, 'Config retrieved');
    } catch (e) {
      next(e);
    }
  },

  updateConfig: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = getCompanyId(req, req.query.companyId as string);
      if (companyId == null) return sendError(res, 'Company context required', 401);
      const { appId, appSecret, verifyToken, redirectUriOverride } = req.body;
      if (!appId || !verifyToken) {
        return sendError(res, 'appId and verifyToken are required', 400);
      }
      await facebookAppConfig.saveConfig(companyId, {
        appId,
        appSecret: appSecret && String(appSecret).trim() ? appSecret : undefined,
        verifyToken,
        redirectUriOverride: redirectUriOverride || null,
      });
      return sendSuccess(res, null, 'Config saved');
    } catch (e) {
      next(e);
    }
  },

  getConfigUrls: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = getCompanyId(req, req.query.companyId as string);
      if (companyId == null) return sendError(res, 'Company context required', 401);
      const { baseUrl, source, _debug } = await getPublicBaseUrl(req);
      const urls = await facebookAppConfig.getConfigUrls(companyId, baseUrl);
      if (!urls) return sendError(res, 'No Facebook config found for this company', 404);
      let ngrokDomain: string | null = null;
      if (baseUrl && /ngrok/i.test(baseUrl)) {
        try {
          ngrokDomain = new URL(baseUrl).host;
        } catch {
          ngrokDomain = null;
        }
      }
      const isNgrokRunning = source === 'ngrok-auto' || !!_debug?.ngrokSuccess;
      return sendSuccess(res, {
        ...urls,
        baseUrl,
        source,
        _debug,
        ngrokDomain,
        isNgrokRunning,
      }, 'URLs retrieved');
    } catch (e) {
      next(e);
    }
  },
};

export const facebookIntegrationController = {
  getConnectUrl: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      const userId = req.user?.id;
      if (!companyId || !userId) return sendError(res, 'Authentication required', 401);
      const { baseUrl } = await getPublicBaseUrl(req);
      const { url } = await facebookIntegration.getConnectUrl(companyId, userId, baseUrl);
      return sendSuccess(res, { url }, 'OK');
    } catch (e: any) {
      return sendError(res, e.message || 'Failed to get connect URL', e.statusCode || 500);
    }
  },

  handleCallback: async (req: any, res: Response) => {
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const { baseUrl } = await getPublicBaseUrl(req);
    try {
      const { code, state, error, error_description } = req.query;
      if (error) {
        return res.redirect(`${frontendUrl}/facebook-oauth-callback?error=${encodeURIComponent(error_description || error)}`);
      }
      if (!code || !state) {
        return res.redirect(`${frontendUrl}/facebook-oauth-callback?error=${encodeURIComponent('Missing code or state')}`);
      }
      const { connectSessionId } = await facebookIntegration.handleCallback(code, state, baseUrl);
      return res.redirect(`${frontendUrl}/facebook-oauth-callback?connectSessionId=${connectSessionId}`);
    } catch (e: any) {
      return res.redirect(`${frontendUrl}/facebook-oauth-callback?error=${encodeURIComponent(e.message || 'Callback failed')}`);
    }
  },

  getConnectSessionPages: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const pages = facebookIntegration.getConnectSessionPages(id);
      return sendSuccess(res, pages, 'OK');
    } catch (e: any) {
      return sendError(res, e.message || 'Invalid session', e.statusCode || 400);
    }
  },

  connectPages: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) return sendError(res, 'Authentication required', 401);
      const { connectSessionId, pageIds } = req.body;
      if (!connectSessionId || !Array.isArray(pageIds)) {
        return sendError(res, 'connectSessionId and pageIds (array) required', 400);
      }
      const results = await facebookIntegration.connectPages(companyId, connectSessionId, pageIds);
      return sendSuccess(res, results, 'Connect completed');
    } catch (e: any) {
      return sendError(res, e.message || 'Connect failed', e.statusCode || 500);
    }
  },

  getDiagnostics: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      const pageId = req.params.pageId;
      if (!companyId || !pageId) return sendError(res, 'Company and page required', 400);
      const result = await facebookIntegration.getDiagnostics(companyId, pageId);
      return sendSuccess(res, result, 'OK');
    } catch (e) {
      next(e);
    }
  },

  sendTestMessage: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      const pageId = req.params.pageId;
      if (!companyId || !pageId) return sendError(res, 'Company and page required', 400);
      const result = await facebookIntegration.sendTestMessage(companyId, pageId);
      return sendSuccess(res, result, 'Test message created');
    } catch (e: any) {
      return sendError(res, e.message || 'Failed', e.statusCode || 500);
    }
  },

  disconnectPage: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      const integrationId = parseInt(req.params.id, 10);
      if (!companyId || isNaN(integrationId)) return sendError(res, 'Company and valid integration ID required', 400);
      await facebookIntegration.disconnectPage(companyId, integrationId);
      return sendSuccess(res, null, 'Page disconnected');
    } catch (e: any) {
      return sendError(res, e.message || 'Disconnect failed', e.statusCode || 500);
    }
  },
};
