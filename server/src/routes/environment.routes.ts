import { Router } from 'express';
import { environmentController } from '../controllers/environment.controller.js';
import { authMiddleware, verifyRole } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication and SuperAdmin role
router.use(authMiddleware);
router.use(verifyRole(['SuperAdmin']));

router.get('/facebook-config', environmentController.getFacebookConfig);
router.put('/facebook-config', environmentController.updateFacebookConfig);
router.get('/webhook-urls', environmentController.getWebhookUrls);

export default router;
