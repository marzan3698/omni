import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authMiddleware, verifyPermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware); // All routes require authentication

router.get('/', verifyPermission('can_view_all_users'), userController.getAllUsers);
router.get('/:id', verifyPermission('can_view_all_users'), userController.getUserById);
router.post('/', verifyPermission('can_manage_users'), userController.createUser);
router.put('/:id', verifyPermission('can_manage_users'), userController.updateUser);
router.delete('/:id', verifyPermission('can_manage_users'), userController.deleteUser);

export default router;

