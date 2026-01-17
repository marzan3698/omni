import { Request, Response, NextFunction } from 'express';
export declare const socialController: {
    /**
     * Facebook Webhook Verification (GET)
     * Facebook sends a GET request to verify the webhook
     */
    verifyFacebookWebhook: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    /**
     * Facebook Webhook Message Handler (POST)
     * Receives messages from Facebook
     */
    handleFacebookWebhook: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get all conversations
     * GET /api/conversations
     */
    getConversations: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get conversation analytics
     * GET /api/conversations/analytics
     */
    getConversationAnalytics: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Public conversation analytics (no auth)
     * GET /api/conversations/analytics/public
     */
    getPublicConversationAnalytics: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get messages for a conversation
     * GET /api/social/conversations/:id/messages
     */
    getConversationMessages: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Send a reply message
     * POST /api/conversations/:id/reply
     * Supports both JSON (text only) and multipart/form-data (text + image)
     */
    sendReply: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Mark conversation messages as read
     * POST /api/conversations/:id/mark-read
     */
    markConversationAsRead: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Mark a single message as read
     * POST /api/conversations/:id/messages/:messageId/mark-read
     */
    markMessageAsRead: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Update typing indicator status
     * POST /api/conversations/:id/typing
     */
    updateTypingStatus: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get typing indicator status
     * GET /api/conversations/:id/typing
     */
    getTypingStatus: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Assign a conversation to an employee
     * POST /api/conversations/:id/assign
     */
    assignConversation: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Unassign a conversation (remove assignment)
     * POST /api/conversations/:id/unassign
     */
    unassignConversation: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Mark conversation as complete (status: 'Closed')
     * POST /api/conversations/:id/complete
     */
    completeConversation: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get conversation statistics (for dashboard)
     * GET /api/conversations/stats
     */
    getConversationStats: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get release history for a conversation
     * GET /api/conversations/:id/releases
     */
    getConversationReleaseHistory: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
};
//# sourceMappingURL=social.controller.d.ts.map