import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authMiddleware, verifyRole } from '../middleware/authMiddleware.js';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/register-client', authController.registerClient);
router.post('/login', authController.login);

// Protected routes
router.get('/me', authMiddleware, authController.getProfile);
router.post('/login-as/:userId', authMiddleware, verifyRole(['SuperAdmin']), authController.loginAs);

export default router;

