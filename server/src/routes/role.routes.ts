import { Router } from 'express';
import { roleController } from '../controllers/role.controller.js';
import { authMiddleware, verifyPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware); // All routes require authentication

router.get('/', verifyPermission('can_manage_roles'), roleController.getAllRoles);
router.get('/:id', verifyPermission('can_manage_roles'), roleController.getRoleById);
router.post('/', verifyPermission('can_manage_roles'), roleController.createRole);
router.put('/:id', verifyPermission('can_manage_roles'), roleController.updateRoleName);
router.put('/:id/permissions', verifyPermission('can_manage_roles'), roleController.updateRolePermissions);
router.delete('/:id', verifyPermission('can_manage_roles'), roleController.deleteRole);

export default router;

