import { Request, Response } from 'express';
export declare const utilsController: {
    /**
     * Get ngrok webhook URL
     * GET /api/utils/ngrok-url
     */
    getNgrokUrl: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Subscribe Facebook Page to Webhook
     * POST /api/utils/subscribe-page
     * Body: { pageId: string, accessToken: string }
     */
    subscribePage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Check Facebook Page Subscription Status
     * GET /api/utils/check-subscription?pageId=xxx&accessToken=xxx
     */
    checkSubscription: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get Chatwoot webhook URL
     * GET /api/utils/chatwoot-webhook-url?integrationId=xxx
     */
    getChatwootWebhookUrl: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=utils.controller.d.ts.map