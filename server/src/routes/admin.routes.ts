import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { verifyPermission } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication and SuperAdmin permission
router.use(authMiddleware);
router.use(verifyPermission('can_manage_companies')); // SuperAdmin permission

router.get('/projects', adminController.getAllProjects);
router.get('/projects/:id', adminController.getProjectById);
router.get('/clients', adminController.getAllClients);
router.get('/clients/:id', adminController.getClientById);
router.put('/projects/:id', adminController.updateProject);
router.delete('/projects/:id', adminController.deleteProject);
router.put('/clients/:id', adminController.updateClient);
router.delete('/clients/:id', adminController.deleteClient);

export default router;

