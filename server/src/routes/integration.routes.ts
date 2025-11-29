import { Router } from 'express';
import { integrationController } from '../controllers/integration.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// All integration routes require authentication
router.get('/', authMiddleware, integrationController.getIntegrations);
router.get('/:id', authMiddleware, integrationController.getIntegrationById);
router.post('/', authMiddleware, integrationController.upsertIntegration);
router.put('/:id', authMiddleware, integrationController.updateIntegration);
router.delete('/:id', authMiddleware, integrationController.deleteIntegration);

export default router;

