import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getRates,
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  getRatesAdmin,
  createRate,
  updateRate,
  deleteRate,
  getStats,
} from '../controllers/exchange.controller';

const router = Router();

// ── Public / Client Routes (requires login) ────────────────────────────────
router.get('/rates', authMiddleware, getRates);
router.post('/orders', authMiddleware, createOrder);
router.get('/orders/my', authMiddleware, getMyOrders);

// ── Admin Routes ────────────────────────────────────────────────────────────
router.get('/admin/rates', authMiddleware, getRatesAdmin);
router.post('/admin/rates', authMiddleware, createRate);
router.put('/admin/rates/:id', authMiddleware, updateRate);
router.delete('/admin/rates/:id', authMiddleware, deleteRate);

router.get('/admin/orders', authMiddleware, getAllOrders);
router.patch('/admin/orders/:id/status', authMiddleware, updateOrderStatus);

router.get('/admin/stats', authMiddleware, getStats);

export default router;
