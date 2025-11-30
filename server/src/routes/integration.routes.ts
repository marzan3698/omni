import { Router } from 'express';
import { integrationController } from '../controllers/integration.controller.js';
import { authMiddleware, verifyPermission } from '../middleware/authMiddleware.js';

const router = Router();

// All integration routes require authentication and can_manage_integrations permission
router.use(authMiddleware);

router.get('/', verifyPermission('can_view_integrations'), integrationController.getIntegrations);
router.get('/:id', verifyPermission('can_view_integrations'), integrationController.getIntegrationById);
router.post('/', verifyPermission('can_manage_integrations'), integrationController.upsertIntegration);
router.put('/:id', verifyPermission('can_manage_integrations'), integrationController.updateIntegration);
router.delete('/:id', verifyPermission('can_manage_integrations'), integrationController.deleteIntegration);

export default router;

