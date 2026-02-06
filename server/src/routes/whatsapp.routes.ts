import { Router } from 'express';
import { whatsappController } from '../controllers/whatsapp.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/connect/:slotId/refresh', authMiddleware, whatsappController.connectRefresh);
router.post('/connect/:slotId', authMiddleware, whatsappController.connect);
router.post('/disconnect/:slotId', authMiddleware, whatsappController.disconnect);
router.get('/status/:slotId', authMiddleware, whatsappController.getStatus);
router.get('/slots', authMiddleware, whatsappController.listSlots);
router.post('/send', authMiddleware, whatsappController.sendMessage);

export default router;
