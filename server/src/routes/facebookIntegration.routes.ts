import { Router } from 'express';
import { facebookIntegrationController } from '../controllers/facebookIntegration.controller.js';
import { authMiddleware, verifyPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/connect-url', authMiddleware, verifyPermission('can_manage_integrations'), facebookIntegrationController.getConnectUrl);
router.get('/callback', facebookIntegrationController.handleCallback);
router.get('/connect-session/:id/pages', authMiddleware, verifyPermission('can_manage_integrations'), facebookIntegrationController.getConnectSessionPages);
router.post('/connect', authMiddleware, verifyPermission('can_manage_integrations'), facebookIntegrationController.connectPages);
router.get('/pages/:pageId/diagnostics', authMiddleware, verifyPermission('can_manage_integrations'), facebookIntegrationController.getDiagnostics);
router.post('/pages/:pageId/test-message', authMiddleware, verifyPermission('can_manage_integrations'), facebookIntegrationController.sendTestMessage);
router.delete('/pages/:id/disconnect', authMiddleware, verifyPermission('can_manage_integrations'), facebookIntegrationController.disconnectPage);

export default router;
