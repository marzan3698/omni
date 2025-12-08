import { Router } from 'express';
import { reviewController } from '../controllers/review.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Public
router.get('/public', reviewController.getPublic);

// Authenticated management
router.get('/', authMiddleware, reviewController.list);
router.post('/', authMiddleware, reviewController.create);
router.put('/:id', authMiddleware, reviewController.update);
router.delete('/:id', authMiddleware, reviewController.remove);

export default router;

