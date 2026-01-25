import { Router } from 'express';
import { facebookOAuthController } from '../controllers/facebookOAuth.controller.js';
import { authMiddleware, verifyPermission } from '../middleware/authMiddleware.js';

const router = Router();

// OAuth callback doesn't require auth (Facebook redirects here)
router.get('/callback', facebookOAuthController.handleCallback);

// All other routes require authentication and permission
router.get('/auth-url', authMiddleware, verifyPermission('can_manage_integrations'), facebookOAuthController.getAuthUrl);
router.post('/connect-page', authMiddleware, verifyPermission('can_manage_integrations'), facebookOAuthController.connectPage);

export default router;
