import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as bookingController from '../controllers/booking.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/availability', bookingController.getAvailability);

export default router;
