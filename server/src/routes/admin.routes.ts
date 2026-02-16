import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { verifyPermission, verifyPermissionAny } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

// Live users - for dashboard (admin/SuperAdmin)
router.get(
  '/live-users',
  verifyPermissionAny(['can_manage_companies', 'can_manage_employees', 'can_manage_inbox']),
  adminController.getLiveUsers
);
router.get(
  '/live-users/:userId/detail',
  verifyPermissionAny(['can_manage_companies', 'can_manage_employees', 'can_manage_inbox']),
  adminController.getLiveUserDetail
);

// Client users - for project creation (select client from dropdown)
router.get(
  '/client-users',
  verifyPermissionAny(['can_manage_companies', 'can_manage_projects']),
  adminController.getClientUsers
);

// Projects - require can_manage_companies or can_manage_projects
const projectPermission = verifyPermissionAny(['can_manage_companies', 'can_manage_projects']);
router.get('/projects', projectPermission, adminController.getAllProjects);
router.post('/projects', projectPermission, adminController.createProject);
router.get('/projects/:id', projectPermission, adminController.getProjectById);
router.put('/projects/:id', projectPermission, adminController.updateProject);
router.delete('/projects/:id', projectPermission, adminController.deleteProject);

// Clients - allow can_manage_companies, can_view_clients, or can_manage_clients (for invoice management)
router.get(
  '/clients',
  verifyPermissionAny(['can_manage_companies', 'can_view_clients', 'can_manage_clients']),
  adminController.getAllClients
);
router.get(
  '/clients/:id',
  verifyPermissionAny(['can_manage_companies', 'can_view_clients', 'can_manage_clients']),
  adminController.getClientById
);
router.put(
  '/clients/:id',
  verifyPermissionAny(['can_manage_companies', 'can_manage_clients']),
  adminController.updateClient
);
router.delete(
  '/clients/:id',
  verifyPermissionAny(['can_manage_companies', 'can_manage_clients']),
  adminController.deleteClient
);

export default router;

