import { Router } from 'express';
import { socialController } from '../controllers/social.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Webhook endpoints (public - no auth required for Facebook)
router.get('/webhooks/facebook', socialController.verifyFacebookWebhook);
router.post('/webhooks/facebook', socialController.handleFacebookWebhook);

// Protected endpoints (require authentication)
router.get('/conversations', authMiddleware, socialController.getConversations);
router.get('/conversations/:id/messages', authMiddleware, socialController.getConversationMessages);
router.post('/conversations/:id/reply', authMiddleware, socialController.sendReply);

export default router;

