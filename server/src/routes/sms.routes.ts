import { Router } from 'express';
import { smsController } from '../controllers/sms.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// SMS settings requires authentication
router.post('/settings', authMiddleware, smsController.saveSettings);
router.get('/settings', authMiddleware, smsController.getSettings);
router.post('/test', authMiddleware, smsController.sendTestSms);
router.post('/bulk', authMiddleware, smsController.sendBulkSms);

export default router;
