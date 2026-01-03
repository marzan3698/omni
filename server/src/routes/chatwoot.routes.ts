import { Router } from 'express';
import { chatwootController } from '../controllers/chatwoot.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Webhook endpoints (public - no auth required for Chatwoot webhooks)
router.get('/webhooks/test', chatwootController.getWebhookTest);
router.post('/webhooks/chatwoot', chatwootController.handleWebhook);

// All other Chatwoot endpoints require authentication
router.post('/sync', authMiddleware, chatwootController.syncConversations);
router.get('/conversations', authMiddleware, chatwootController.getConversations);
router.get('/conversations/:id/messages', authMiddleware, chatwootController.getMessages);
router.post('/conversations/:id/reply', authMiddleware, chatwootController.sendReply);

export default router;

