import { Request, Response, NextFunction } from 'express';
import { socialService } from '../services/social.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';

export const socialController = {
  /**
   * Facebook Webhook Verification (GET)
   * Facebook sends a GET request to verify the webhook
   */
  verifyFacebookWebhook: (req: Request, res: Response, next: NextFunction) => {
    try {
      const mode = req.query['hub.mode'] as string;
      const token = req.query['hub.verify_token'] as string;
      const challenge = req.query['hub.challenge'] as string;

      console.log('=== Webhook Verification Request ===');
      console.log('Mode:', mode);
      console.log('Token:', token ? '***' : 'missing');
      console.log('Challenge:', challenge);

      // If no query parameters, this might be a direct browser access
      // Return a simple message instead of error
      if (!mode || !token || !challenge) {
        console.log('Missing verification parameters - might be direct browser access');
        // For browser access, return a simple message
        // For Facebook verification, return error as plain text
        if (req.method === 'GET' && Object.keys(req.query).length === 0) {
          return res.status(200).send('Webhook endpoint is active. This endpoint is for Facebook webhook verification only.');
        }
        // Facebook expects plain text even for errors during verification
        return res.status(400).send('Missing required parameters');
      }

      const challengeResponse = socialService.verifyWebhook(token, challenge, mode);

      // Facebook expects a plain text response with the challenge
      console.log('✅ Webhook verification successful');
      res.status(200).send(challengeResponse);
    } catch (error) {
      console.error('❌ Webhook verification failed:', error);
      // For webhook verification, Facebook expects plain text response
      if (error instanceof AppError) {
        return res.status(error.statusCode).send(error.message);
      }
      return res.status(500).send('Internal server error');
    }
  },

  /**
   * Facebook Webhook Message Handler (POST)
   * Receives messages from Facebook
   */
  handleFacebookWebhook: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const timestamp = new Date().toISOString();
      console.log(`\n${'='.repeat(60)}`);
      console.log(`[${timestamp}] === Facebook Webhook Received ===`);
      console.log('Method:', req.method);
      console.log('URL:', req.url);
      console.log('Content-Type:', req.headers['content-type']);
      console.log('User-Agent:', req.headers['user-agent']);

      // Facebook requires immediate 200 response
      res.status(200).send('EVENT_RECEIVED');
      console.log('✅ Sent 200 response to Facebook');

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

      const payloadType = payload.object || payload.field || 'unknown';
      console.log('📦 Payload type:', payloadType);
      console.log('Payload keys:', Object.keys(payload));

      if (payload.entry && Array.isArray(payload.entry)) {
        console.log(`📨 Number of entries: ${payload.entry.length}`);
        payload.entry.forEach((entry: any, index: number) => {
          console.log(`  Entry ${index + 1}:`, {
            id: entry.id,
            time: entry.time,
            messagingCount: entry.messaging?.length || 0
          });
        });
      }

      await socialService.processFacebookMessage(payload);

      console.log('✅ === Webhook Processing Complete ===');
      console.log(`${'='.repeat(60)}\n`);

      // Note: Response already sent, so we don't send another one
    } catch (error) {
      console.error('\n❌ === Error processing Facebook webhook ===');
      console.error('Error:', error);
      // Don't send error response as Facebook already received 200
      // Log the error for debugging
      if (error instanceof AppError) {
        console.error(`AppError: ${error.message} (${error.statusCode})`);
      } else {
        console.error('Stack:', (error as Error).stack);
      }
      console.error(`${'='.repeat(60)}\n`);
    }
  },

  /**
   * Get all conversations
   * GET /api/conversations
   */
  getConversations: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as 'Open' | 'Closed' | undefined;
      const companyId = (req as any).user?.companyId;
      const conversations = await socialService.getConversations(status, companyId);
      sendSuccess(res, conversations, 'Conversations retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get conversation analytics
   * GET /api/conversations/analytics
   */
  getConversationAnalytics: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = (req as any).user?.companyId;
      const daysParam = req.query.days;
      const days = daysParam ? parseInt(daysParam as string, 10) : 30;

      const analytics = await socialService.getConversationAnalytics(companyId, days);
      sendSuccess(res, analytics, 'Conversation analytics retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * Public conversation analytics (no auth)
   * GET /api/conversations/analytics/public
   */
  getPublicConversationAnalytics: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyIdParam = req.query.companyId ? parseInt(req.query.companyId as string, 10) : undefined;
      const daysParam = req.query.days;
      const days = daysParam ? parseInt(daysParam as string, 10) : 30;

      const analytics = await socialService.getConversationAnalytics(companyIdParam, days);
      sendSuccess(res, analytics, 'Conversation analytics retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * Get messages for a conversation
   * GET /api/social/conversations/:id/messages
   */
  getConversationMessages: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversationId = parseInt(req.params.id, 10);
      const companyId = (req as any).user?.companyId;

      if (isNaN(conversationId)) {
        return sendError(res, 'Invalid conversation ID', 400);
      }

      const conversation = await socialService.getConversationMessages(conversationId, companyId);
      sendSuccess(res, conversation, 'Messages retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * Send a reply message
   * POST /api/conversations/:id/reply
   * Supports both JSON (text only) and multipart/form-data (text + image)
   */
  sendReply: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversationId = parseInt(req.params.id, 10);
      const agentId = (req as any).user?.id;

      console.log('📨 Send reply request:', {
        conversationId,
        hasFile: !!req.file,
        fileName: req.file?.filename,
        fileSize: req.file?.size,
        fileMimetype: req.file?.mimetype,
        contentType: req.headers['content-type'],
        bodyContent: req.body.content,
        bodyKeys: Object.keys(req.body),
      });

      if (isNaN(conversationId)) {
        return sendError(res, 'Invalid conversation ID', 400);
      }

      if (!agentId) {
        return sendError(res, 'User not authenticated', 401);
      }

      // Handle multipart/form-data (with image) or JSON (text only)
      let content = '';
      let imageUrl: string | null = null;

      if (req.file) {
        // Multipart/form-data request with image
        content = (req.body.content as string) || '';
        // Construct image URL from uploaded file
        imageUrl = `/uploads/social/${req.file.filename}`;
        console.log('✅ Image uploaded:', imageUrl);
      } else {
        // JSON request (text only)
        content = req.body.content || '';
      }

      // Validate: must have either content or image
      if (!content.trim() && !imageUrl) {
        console.warn('⚠️ No content or image provided');
        return sendError(res, 'Message content or image is required', 400);
      }

      console.log('📤 Sending message:', { conversationId, hasContent: !!content.trim(), hasImage: !!imageUrl });

      const message = await socialService.sendReply(
        conversationId,
        content.trim(),
        agentId,
        imageUrl
      );

      console.log('✅ Message sent successfully:', message.id);
      sendSuccess(res, message, 'Message sent successfully', 201);
    } catch (error: any) {
      console.error('❌ Error in sendReply:', {
        error: error.message,
        code: error.code,
        stack: error.stack,
        name: error.name,
      });

      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }

      // Handle multer errors
      if (error.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 'File size too large. Maximum size is 5MB.', 400);
      }
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return sendError(res, 'Unexpected file field. Use "image" as the field name.', 400);
      }
      if (error.message && error.message.includes('Invalid file type')) {
        return sendError(res, error.message, 400);
      }
      if (error.name === 'MulterError') {
        return sendError(res, `File upload error: ${error.message}`, 400);
      }

      // If it's a validation error (422), return it as is
      if (error.statusCode === 422 || error.status === 422) {
        return sendError(res, error.message || 'Validation error', 422);
      }

      next(error);
    }
  },

  /**
   * Mark conversation messages as read
   * POST /api/conversations/:id/mark-read
   */
  markConversationAsRead: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversationId = parseInt(req.params.id, 10);
      const userId = (req as any).user?.id;
      const companyId = (req as any).user?.companyId;

      if (isNaN(conversationId)) {
        return sendError(res, 'Invalid conversation ID', 400);
      }

      if (!userId || !companyId) {
        return sendError(res, 'User not authenticated', 401);
      }

      const result = await socialService.markMessagesAsRead(conversationId, userId, companyId);
      sendSuccess(res, result, 'Messages marked as read successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * Mark a single message as read
   * POST /api/conversations/:id/messages/:messageId/mark-read
   */
  markMessageAsRead: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const messageId = parseInt(req.params.messageId, 10);
      const userId = (req as any).user?.id;
      const companyId = (req as any).user?.companyId;

      if (isNaN(messageId)) {
        return sendError(res, 'Invalid message ID', 400);
      }

      if (!userId || !companyId) {
        return sendError(res, 'User not authenticated', 401);
      }

      const message = await socialService.markMessageAsRead(messageId, userId, companyId);
      sendSuccess(res, message, 'Message marked as read successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * Update typing indicator status
   * POST /api/conversations/:id/typing
   */
  updateTypingStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversationId = parseInt(req.params.id, 10);
      const userId = (req as any).user?.id;
      const { isTyping } = req.body;

      if (isNaN(conversationId)) {
        return sendError(res, 'Invalid conversation ID', 400);
      }

      if (!userId) {
        return sendError(res, 'User not authenticated', 401);
      }

      if (typeof isTyping !== 'boolean') {
        return sendError(res, 'isTyping must be a boolean', 400);
      }

      const result = socialService.updateTypingStatus(conversationId, userId, isTyping);
      sendSuccess(res, result, 'Typing status updated successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * Get typing indicator status
   * GET /api/conversations/:id/typing
   */
  getTypingStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversationId = parseInt(req.params.id, 10);

      if (isNaN(conversationId)) {
        return sendError(res, 'Invalid conversation ID', 400);
      }

      const status = socialService.getTypingStatus(conversationId);
      sendSuccess(res, status || { isTyping: false }, 'Typing status retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  },
};

