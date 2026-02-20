import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../utils/response.js';
import {
    processChatwootWebhook,
    getChatwootConfig,
    saveChatwootConfig,
    testChatwootConnection,
} from '../services/chatwoot.service.js';
import { prisma } from '../lib/prisma.js';

export const chatwootController = {
    /**
     * POST /api/webhooks/chatwoot
     * Public endpoint — Chatwoot sends webhook events here.
     * Chatwoot identifies the company via a ?companyId= query param (or you can use a per-company token).
     */
    handleWebhook: async (req: Request, res: Response, next: NextFunction) => {
        // Immediately acknowledge to Chatwoot
        res.status(200).send('OK');

        try {
            const companyId = parseInt(req.query.companyId as string, 10);
            if (!companyId || isNaN(companyId)) {
                console.warn('⚠️ Chatwoot webhook: missing or invalid companyId query param');
                return;
            }

            console.log(`📨 Chatwoot webhook received (companyId=${companyId}, event=${req.body?.event})`);
            await processChatwootWebhook(req.body, companyId);
        } catch (err) {
            console.error('❌ Chatwoot webhook processing error:', err);
        }
    },

    /**
     * GET /api/chatwoot/config
     * SuperAdmin: get current Chatwoot config (token masked).
     */
    getConfig: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const companyId = (req as any).user?.companyId;
            if (!companyId) return sendError(res, 'Unauthorized', 401);

            const config = await getChatwootConfig(companyId);

            if (!config) {
                return sendSuccess(res, { configured: false }, 'No Chatwoot config found');
            }

            // Mask the API token for security
            return sendSuccess(res, {
                configured: true,
                baseUrl: config.baseUrl,
                accountId: config.accountId,
                apiToken: config.apiToken ? '***' + config.apiToken.slice(-4) : '',
                hasWebhookSecret: !!config.webhookSecret,
            }, 'Chatwoot config retrieved');
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /api/chatwoot/config
     * SuperAdmin: save Chatwoot config.
     */
    saveConfig: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const companyId = (req as any).user?.companyId;
            if (!companyId) return sendError(res, 'Unauthorized', 401);

            const { baseUrl, apiToken, accountId, webhookSecret } = req.body;

            if (!baseUrl || !apiToken || !accountId) {
                return sendError(res, 'baseUrl, apiToken and accountId are required', 400);
            }

            await saveChatwootConfig(companyId, {
                baseUrl: baseUrl.trim(),
                apiToken: apiToken.trim(),
                accountId: parseInt(accountId, 10),
                webhookSecret: webhookSecret?.trim() || '',
            });

            return sendSuccess(res, { saved: true }, 'Chatwoot config saved');
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /api/chatwoot/test
     * SuperAdmin: test the Chatwoot connection.
     */
    testConnection: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const companyId = (req as any).user?.companyId;
            if (!companyId) return sendError(res, 'Unauthorized', 401);

            const { baseUrl, apiToken, accountId } = req.body;

            if (!baseUrl || !apiToken || !accountId) {
                return sendError(res, 'baseUrl, apiToken and accountId are required', 400);
            }

            const result = await testChatwootConnection({
                baseUrl: baseUrl.trim(),
                apiToken: apiToken.trim(),
                accountId: parseInt(accountId, 10),
            });

            if (result.ok) {
                return sendSuccess(res, result, result.message);
            } else {
                return sendError(res, result.message, 400);
            }
        } catch (err) {
            next(err);
        }
    },

    /**
     * DELETE /api/chatwoot/config
     * SuperAdmin: remove Chatwoot config.
     */
    deleteConfig: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const companyId = (req as any).user?.companyId;
            if (!companyId) return sendError(res, 'Unauthorized', 401);

            await prisma.systemSetting.deleteMany({
                where: {
                    companyId,
                    key: { in: ['chatwoot_base_url', 'chatwoot_api_token', 'chatwoot_account_id', 'chatwoot_webhook_secret'] },
                },
            });

            return sendSuccess(res, { deleted: true }, 'Chatwoot config removed');
        } catch (err) {
            next(err);
        }
    },
};
