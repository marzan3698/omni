import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all payments (admin)
router.get('/', paymentController.getAll);

// Get client's own payments
router.get('/client', paymentController.getClientPayments);

// Get payments by invoice
router.get('/invoice/:invoiceId', paymentController.getByInvoice);

// Get payment by ID
router.get('/:id', paymentController.getById);

// Create payment (client submission)
router.post('/', paymentController.create);

// Approve payment
router.put('/:id/approve', paymentController.approve);

// Reject payment
router.put('/:id/reject', paymentController.reject);

export default router;

