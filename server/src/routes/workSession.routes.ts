import { Router } from 'express';
import { workSessionController } from '../controllers/workSession.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/toggle', authMiddleware, workSessionController.toggleLiveStatus);
router.get('/current', authMiddleware, workSessionController.getCurrentSession);
router.get('/history', authMiddleware, workSessionController.getWorkHistory);

export default router;
