import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { uploadExchangeImage } from '../middleware/upload.js';
import {
  getRates,
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  getOrderDetails,
  getRatesAdmin,
  createRate,
  updateRate,
  deleteRate,
  getStats,
} from '../controllers/exchange.controller.js';

const router = Router();

// ── Public / Client Routes (requires login) ────────────────────────────────
router.get('/rates', authMiddleware, getRates);
router.post('/orders', authMiddleware, uploadExchangeImage.single('proofImage'), createOrder);
router.get('/orders/my', authMiddleware, getMyOrders);
router.get('/orders/:id', authMiddleware, getOrderDetails);

// ── Admin Routes ────────────────────────────────────────────────────────────
router.get('/admin/rates', authMiddleware, getRatesAdmin);
router.post('/admin/rates', authMiddleware, uploadExchangeImage.single('qrCode'), createRate);
router.put('/admin/rates/:id', authMiddleware, uploadExchangeImage.single('qrCode'), updateRate);
router.delete('/admin/rates/:id', authMiddleware, deleteRate);

router.get('/admin/orders', authMiddleware, getAllOrders);
router.patch('/admin/orders/:id/status', authMiddleware, updateOrderStatus);

router.get('/admin/stats', authMiddleware, getStats);

export default router;
