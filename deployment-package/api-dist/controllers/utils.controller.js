import { sendSuccess, sendError } from '../utils/response.js';
import axios from 'axios';
export const utilsController = {
    /**
     * Get ngrok webhook URL
     * GET /api/utils/ngrok-url
     */
    getNgrokUrl: async (req, res) => {
        try {
            // Fetch ngrok tunnels from ngrok API
            const ngrokResponse = await fetch('http://127.0.0.1:4040/api/tunnels');
            if (!ngrokResponse.ok) {
                return sendSuccess(res, {
                    url: null,
                    webhookUrl: null,
                    available: false
                }, 'ngrok not available');
            }
            const ngrokData = await ngrokResponse.json();
            const tunnels = ngrokData.tunnels || [];
            if (tunnels.length > 0) {
                const ngrokUrl = tunnels[0].public_url;
                const webhookUrl = `${ngrokUrl}/api/webhooks/facebook`;
                return sendSuccess(res, {
                    url: ngrokUrl,
                    webhookUrl: webhookUrl,
                    available: true
                }, 'ngrok URL retrieved successfully');
            }
            return sendSuccess(res, {
                url: null,
                webhookUrl: null,
                available: false
            }, 'ngrok running but no tunnels found');
        }
        catch (error) {
            // ngrok not running or not accessible
            return sendSuccess(res, {
                url: null,
                webhookUrl: null,
                available: false
            }, 'ngrok not available');
        }
    },
    /**
     * Subscribe Facebook Page to Webhook
     * POST /api/utils/subscribe-page
     * Body: { pageId: string, accessToken: string }
     */
    subscribePage: async (req, res) => {
        try {
            const { pageId, accessToken } = req.body;
            if (!pageId || !accessToken) {
                return sendError(res, 'Page ID and Access Token are required', 400);
            }
            // Subscribe page to webhook using Facebook Graph API
            const subscribeUrl = `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps`;
            try {
                const response = await axios.post(subscribeUrl, null, {
                    params: {
                        access_token: accessToken,
                        subscribed_fields: 'messages,messaging_postbacks,message_deliveries,message_reads'
                    }
                });
                if (response.data.success) {
                    return sendSuccess(res, {
                        pageId,
                        subscribed: true,
                        subscribedFields: response.data.data || []
                    }, 'Page subscribed successfully');
                }
                else {
                    return sendError(res, 'Failed to subscribe page', 400);
                }
            }
            catch (error) {
                const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error';
                return sendError(res, `Facebook API Error: ${errorMessage}`, error.response?.status || 500);
            }
        }
        catch (error) {
            return sendError(res, error.message || 'Failed to subscribe page', 500);
        }
    },
    /**
     * Check Facebook Page Subscription Status
     * GET /api/utils/check-subscription?pageId=xxx&accessToken=xxx
     */
    checkSubscription: async (req, res) => {
        try {
            const { pageId, accessToken } = req.query;
            if (!pageId || !accessToken) {
                return sendError(res, 'Page ID and Access Token are required', 400);
            }
            // Check subscription status using Facebook Graph API
            const checkUrl = `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps`;
            try {
                const response = await axios.get(checkUrl, {
                    params: {
                        access_token: accessToken
                    }
                });
                const appId = process.env.FACEBOOK_APP_ID || '1362036352081793';
                const subscriptions = response.data.data || [];
                const isSubscribed = subscriptions.some((sub) => sub.id === appId);
                return sendSuccess(res, {
                    pageId,
                    isSubscribed,
                    subscriptions: subscriptions,
                    appId
                }, isSubscribed ? 'Page is subscribed' : 'Page is not subscribed');
            }
            catch (error) {
                const fbError = error.response?.data?.error;
                let errorMessage = fbError?.message || error.message || 'Unknown error';
                const errorCode = fbError?.code;
                // Provide helpful error messages based on Facebook error codes
                if (errorCode === 200) {
                    errorMessage = 'Missing permission: pages_manage_metadata. Please generate a new Page Access Token with pages_manage_metadata permission.';
                }
                else if (errorCode === 100) {
                    errorMessage = 'Missing permission: pages_read_engagement. Please generate a new Page Access Token with pages_read_engagement permission.';
                }
                else if (errorCode === 190) {
                    errorMessage = 'Access token expired. Please generate a new Page Access Token.';
                }
                return sendError(res, `Facebook API Error: ${errorMessage}`, error.response?.status || 500);
            }
        }
        catch (error) {
            return sendError(res, error.message || 'Failed to check subscription', 500);
        }
    },
    /**
     * Get Chatwoot webhook URL
     * GET /api/utils/chatwoot-webhook-url?integrationId=xxx
     */
    getChatwootWebhookUrl: async (req, res) => {
        try {
            const integrationId = req.query.integrationId
                ? parseInt(req.query.integrationId, 10)
                : undefined;
            if (integrationId && isNaN(integrationId)) {
                return sendError(res, 'Invalid integration ID', 400);
            }
            const { getChatwootWebhookUrl } = await import('../utils/webhook.js');
            const webhookUrl = await getChatwootWebhookUrl(undefined, integrationId);
            return sendSuccess(res, {
                webhookUrl,
                integrationId: integrationId || null,
            }, 'Webhook URL retrieved successfully');
        }
        catch (error) {
            return sendError(res, error.message || 'Failed to get webhook URL', 500);
        }
    },
};
//# sourceMappingURL=utils.controller.js.map