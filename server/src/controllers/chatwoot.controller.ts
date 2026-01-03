import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../utils/response.js';
import { chatwootService } from '../services/chatwoot.service.js';
import { socialService } from '../services/social.service.js';
import { integrationService } from '../services/integration.service.js';
import { AppError } from '../middleware/errorHandler.js';

export const chatwootController = {
  /**
   * Sync conversations from Chatwoot API to database
   * POST /api/chatwoot/sync
   * Body: { integrationId?: number } (optional - syncs all if not provided)
   */
  syncConversations: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { integrationId } = req.body;

      if (integrationId) {
        // Sync specific integration
        const integration = await integrationService.getIntegrationById(integrationId);

        if (integration.provider !== 'chatwoot') {
          return sendError(res, 'Integration is not a Chatwoot integration', 400);
        }

        if (!integration.accountId) {
          return sendError(res, 'Chatwoot integration missing account ID', 400);
        }

        const result = await chatwootService.syncChatwootConversations(
          integration.accountId,
          integration.pageId, // inboxId
          integration.accessToken,
          integration.baseUrl
        );

        return sendSuccess(res, result, 'Chatwoot conversations synced successfully');
      } else {
        // Sync all active Chatwoot integrations
        const result = await socialService.syncChatwootConversations();
        return sendSuccess(res, result, 'All Chatwoot conversations synced successfully');
      }
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * Get Chatwoot conversations (via social service - includes all platforms)
   * GET /api/chatwoot/conversations
   */
  getConversations: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as 'Open' | 'Closed' | undefined;
      const companyId = (req as any).user?.companyId;
      const conversations = await socialService.getConversations(status, companyId);
      
      // Filter Chatwoot conversations only
      const chatwootConversations = conversations.filter(
        (conv) => conv.platform === 'chatwoot'
      );

      return sendSuccess(res, chatwootConversations, 'Chatwoot conversations retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get messages for a Chatwoot conversation
   * GET /api/chatwoot/conversations/:id/messages
   */
  getMessages: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversationId = parseInt(req.params.id, 10);
      const companyId = (req as any).user?.companyId;

      if (isNaN(conversationId)) {
        return sendError(res, 'Invalid conversation ID', 400);
      }

      const conversation = await socialService.getConversationMessages(conversationId, companyId);

      if (conversation.platform !== 'chatwoot') {
        return sendError(res, 'Conversation is not a Chatwoot conversation', 400);
      }

      return sendSuccess(res, conversation, 'Chatwoot messages retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * Send a reply message via Chatwoot API
   * POST /api/chatwoot/conversations/:id/reply
   */
  sendReply: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversationId = parseInt(req.params.id, 10);
      const { content } = req.body;
      const agentId = (req as any).user?.id;

      if (isNaN(conversationId)) {
        return sendError(res, 'Invalid conversation ID', 400);
      }

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return sendError(res, 'Message content is required', 400);
      }

      if (!agentId) {
        return sendError(res, 'User not authenticated', 401);
      }

      // Use social service which handles Chatwoot API calls
      const message = await socialService.sendReply(conversationId, content.trim(), agentId);
      return sendSuccess(res, message, 'Message sent successfully', 201);
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * Get webhook test URL and status
   * GET /api/chatwoot/webhooks/test
   * Returns the webhook URL that should be configured in Chatwoot
   */
  getWebhookTest: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { getChatwootWebhookUrl } = await import('../utils/webhook.js');
      const webhookUrl = await getChatwootWebhookUrl();
      
      // Get active Chatwoot integrations
      const integrations = await integrationService.getIntegrations();
      const chatwootIntegrations = integrations.filter(
        (i) => i.provider === 'chatwoot' && i.isActive
      );

      return sendSuccess(
        res,
        {
          webhookUrl,
          integrations: chatwootIntegrations.map((i) => ({
            id: i.id,
            accountId: i.accountId,
            pageId: i.pageId,
            isActive: i.isActive,
            isWebhookActive: i.isWebhookActive,
            webhookMode: i.webhookMode,
          })),
          instructions: [
            '1. Copy the webhookUrl above',
            '2. Go to Chatwoot Dashboard → Settings → Integrations → Webhooks',
            '3. Paste the URL in the webhook URL field',
            '4. Select event: message_created',
            '5. Save the webhook',
            '6. Make sure isWebhookActive is true in your integration',
          ],
        },
        'Webhook test information retrieved successfully'
      );
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * Handle Chatwoot webhook events
   * POST /api/webhooks/chatwoot
   * Receives webhook notifications from Chatwoot when messages are created
   */
  handleWebhook: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const timestamp = new Date().toISOString();
      console.log(`\n${'='.repeat(60)}`);
      console.log(`[${timestamp}] === Chatwoot Webhook Received ===`);
      console.log('Method:', req.method);
      console.log('URL:', req.url);
      console.log('Content-Type:', req.headers['content-type']);

      // Chatwoot requires immediate 200 response
      res.status(200).send('EVENT_RECEIVED');
      console.log('✅ Sent 200 response to Chatwoot');

      // Process the webhook payload asynchronously
      // If body is raw buffer, parse it as JSON
      let payload;
      if (Buffer.isBuffer(req.body)) {
        const bodyString = req.body.toString();
        console.log('Raw body length:', bodyString.length);
        console.log('Raw body (first 500 chars):', bodyString.substring(0, 500));
        try {
          payload = JSON.parse(bodyString);
        } catch (parseError) {
          console.error('❌ Failed to parse JSON:', parseError);
          return; // Can't process if JSON is invalid
        }
      } else {
        payload = req.body;
      }

      const eventType = payload.event || 'unknown';
      console.log('📦 Event type:', eventType);
      console.log('Payload keys:', Object.keys(payload));

      // Process the webhook
      await chatwootService.processChatwootWebhook(payload);

      console.log('✅ === Webhook Processing Complete ===');
      console.log(`${'='.repeat(60)}\n`);

      // Note: Response already sent, so we don't send another one
    } catch (error) {
      console.error('\n❌ === Error processing Chatwoot webhook ===');
      console.error('Error:', error);
      // Don't send error response as Chatwoot already received 200
      // Log the error for debugging
      if (error instanceof AppError) {
        console.error(`AppError: ${error.message} (${error.statusCode})`);
      } else {
        console.error('Stack:', (error as Error).stack);
      }
      console.error(`${'='.repeat(60)}\n`);
    }
  },
};

