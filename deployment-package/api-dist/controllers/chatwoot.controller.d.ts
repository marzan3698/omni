import { Request, Response, NextFunction } from 'express';
export declare const chatwootController: {
    /**
     * Sync conversations from Chatwoot API to database
     * POST /api/chatwoot/sync
     * Body: { integrationId?: number } (optional - syncs all if not provided)
     */
    syncConversations: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get Chatwoot conversations (via social service - includes all platforms)
     * GET /api/chatwoot/conversations
     */
    getConversations: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get messages for a Chatwoot conversation
     * GET /api/chatwoot/conversations/:id/messages
     */
    getMessages: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Send a reply message via Chatwoot API
     * POST /api/chatwoot/conversations/:id/reply
     */
    sendReply: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get webhook test URL and status
     * GET /api/chatwoot/webhooks/test
     * Returns the webhook URL that should be configured in Chatwoot
     */
    getWebhookTest: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Handle Chatwoot webhook events
     * POST /api/webhooks/chatwoot
     * Receives webhook notifications from Chatwoot when messages are created
     */
    handleWebhook: (req: Request, res: Response, next: NextFunction) => Promise<void>;
};
//# sourceMappingURL=chatwoot.controller.d.ts.map