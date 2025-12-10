import { Router } from 'express';
import { employeeGroupController } from '../controllers/employeeGroup.controller.js';
import { authMiddleware, verifyPermission } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all employee groups
router.get('/', verifyPermission('can_manage_employees'), employeeGroupController.getAllGroups);

// Get group members
router.get('/:id/members', verifyPermission('can_manage_employees'), employeeGroupController.getGroupMembers);

// Get employee group by ID
router.get('/:id', verifyPermission('can_manage_employees'), employeeGroupController.getGroupById);

// Create employee group
router.post('/', verifyPermission('can_manage_employees'), employeeGroupController.createGroup);

// Update employee group
router.put('/:id', verifyPermission('can_manage_employees'), employeeGroupController.updateGroup);

// Delete employee group
router.delete('/:id', verifyPermission('can_manage_employees'), employeeGroupController.deleteGroup);

export default router;

