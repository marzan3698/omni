import { Router } from 'express';
import { bkashController } from '../controllers/bkash.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Create payment requires authentication
router.post('/create', authMiddleware, bkashController.createPayment);

// Callback from bKash doesn't have our auth headers (it's a browser redirect from bKash)
router.get('/callback', bkashController.callback);

export default router;
