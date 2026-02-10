import { Router } from 'express';
import { facebookConfigController } from '../controllers/facebookIntegration.controller.js';
import { authMiddleware, verifyPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);
router.get('/config', verifyPermission('can_manage_root_items'), facebookConfigController.getConfig);
router.put('/config', verifyPermission('can_manage_root_items'), facebookConfigController.updateConfig);
router.get('/config/urls', verifyPermission('can_manage_root_items'), facebookConfigController.getConfigUrls);

export default router;
