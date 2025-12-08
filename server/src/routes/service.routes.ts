import { Router } from 'express';
import { serviceController } from '../controllers/service.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { verifyPermission } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all services (all authenticated users can view)
router.get('/', serviceController.getAllServices);

// Get service by ID (all authenticated users can view)
router.get('/:id', serviceController.getServiceById);

// Create, update, delete require SuperAdmin permission
router.post('/', verifyPermission('can_manage_products'), serviceController.createService);
router.put('/:id', verifyPermission('can_manage_products'), serviceController.updateService);
router.delete('/:id', verifyPermission('can_manage_products'), serviceController.deleteService);

export default router;

