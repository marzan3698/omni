import { Router } from 'express';
import { utilsController } from '../controllers/utils.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
const router = Router();
// Public utility routes
router.get('/ngrok-url', utilsController.getNgrokUrl);
// Protected routes (require authentication)
router.post('/subscribe-page', authMiddleware, utilsController.subscribePage);
router.get('/check-subscription', authMiddleware, utilsController.checkSubscription);
router.get('/chatwoot-webhook-url', authMiddleware, utilsController.getChatwootWebhookUrl);
export default router;
//# sourceMappingURL=utils.routes.js.map