import { Router } from 'express';
import { whatsappController } from '../controllers/whatsapp.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/connect', authMiddleware, whatsappController.connect);
router.post('/disconnect', authMiddleware, whatsappController.disconnect);
router.get('/status', authMiddleware, whatsappController.getStatus);
router.post('/send', authMiddleware, whatsappController.sendMessage);

export default router;
