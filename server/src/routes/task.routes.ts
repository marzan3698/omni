import { Router } from 'express';
import { taskController } from '../controllers/task.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { verifyPermission } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Task routes
router.get('/', verifyPermission('can_manage_tasks'), taskController.getAllTasks);
router.get('/user/:userId', verifyPermission('can_view_tasks'), taskController.getUserTasks);
router.get('/:id', verifyPermission('can_manage_tasks'), taskController.getTaskById);
router.post('/', verifyPermission('can_manage_tasks'), taskController.createTask);
router.put('/:id', verifyPermission('can_manage_tasks'), taskController.updateTask);
router.delete('/:id', verifyPermission('can_manage_tasks'), taskController.deleteTask);
router.put('/:id/status', verifyPermission('can_manage_tasks'), taskController.updateTaskStatus);
router.get('/:id/comments', verifyPermission('can_manage_tasks'), taskController.getTaskComments);
router.post('/:id/comments', verifyPermission('can_manage_tasks'), taskController.addTaskComment);

export default router;

