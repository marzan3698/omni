import { Router } from 'express';
import { socialController } from '../controllers/social.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { singleSocialImage } from '../middleware/upload.js';

const router = Router();

// Webhook endpoints (public - no auth required for Facebook)
router.get('/webhooks/facebook', socialController.verifyFacebookWebhook);
router.post('/webhooks/facebook', socialController.handleFacebookWebhook);
router.get('/conversations/analytics/public', socialController.getPublicConversationAnalytics);

// Protected endpoints (require authentication)
router.get('/conversations', authMiddleware, socialController.getConversations);
router.get('/conversations/analytics', authMiddleware, socialController.getConversationAnalytics);
router.get('/conversations/:id/messages', authMiddleware, socialController.getConversationMessages);
router.post('/conversations/:id/mark-read', authMiddleware, socialController.markConversationAsRead);
router.post('/conversations/:id/messages/:messageId/mark-read', authMiddleware, socialController.markMessageAsRead);
router.post('/conversations/:id/typing', authMiddleware, socialController.updateTypingStatus);
router.get('/conversations/:id/typing', authMiddleware, socialController.getTypingStatus);
// Reply endpoint with image upload support
// Note: singleSocialImage middleware handles file upload, errors are caught in controller
router.post('/conversations/:id/reply', authMiddleware, (req, res, next) => {
    // Handle multer errors
    singleSocialImage(req, res, (err: any) => {
        if (err) {
            console.error('❌ Multer error in route:', {
                message: err.message,
                code: err.code,
                field: err.field,
                name: err.name,
            });
            // Pass error to controller to handle with proper status code
            // Multer errors should be 400 (Bad Request), not 422
            err.statusCode = 400;
            return next(err);
        }
        next();
    });
}, socialController.sendReply);

export default router;

