import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authMiddleware, verifyRole } from '../middleware/authMiddleware.js';

const router = Router();

// Public routes
router.post('/register', authController.register as any);
router.post('/register-client', authController.registerClient as any);
router.post('/login', authController.login as any);

// Protected routes
router.get('/me', authMiddleware, authController.getProfile as any);
router.put('/me', authMiddleware, authController.updateProfile as any);
router.post('/login-as/:userId', authMiddleware, verifyRole(['SuperAdmin']), authController.loginAs as any);

export default router;

