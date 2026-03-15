import { Router } from 'express';
import { serviceController } from '../controllers/service.controller.js';
import { authMiddleware, verifyPermission } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all services (all authenticated users can view)
router.get('/', serviceController.getAllServices);

// Get service by ID (all authenticated users can view)
router.get('/:id', serviceController.getServiceById);

// Create, update, delete require manage_products permission
router.post('/', verifyPermission('can_manage_products'), serviceController.createService);
router.put('/:id', verifyPermission('can_manage_products'), serviceController.updateService);
router.delete('/:id', verifyPermission('can_manage_products'), serviceController.deleteService);

// Media upload routes
router.post('/thumbnail', verifyPermission('can_manage_products'), serviceController.uploadThumbnail);
router.post('/gallery', verifyPermission('can_manage_products'), serviceController.uploadGallery);

export default router;

