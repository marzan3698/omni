import { Router } from 'express';
import { taskController } from '../controllers/task.controller.js';
import { authMiddleware, verifyRole, verifyPermission, verifyTaskViewAccess, verifyTaskUpdateAccess } from '../middleware/authMiddleware.js';
import { singleTaskAttachment } from '../middleware/upload.js';
const router = Router();
// All routes require authentication
router.use(authMiddleware);
// Task routes - More specific routes first
router.get('/', verifyPermission('can_manage_tasks'), taskController.getAllTasks);
// Allow users to view their own tasks OR users with can_view_tasks permission
router.get('/user/:userId', verifyTaskViewAccess, taskController.getUserTasks);
// Attachment routes (must come before /:id routes)
router.post('/attachments/link', verifyTaskUpdateAccess, taskController.addLinkAttachment);
router.delete('/attachments/:id', verifyTaskUpdateAccess, taskController.deleteAttachment);
// Audio upload route (must come before /:id routes)
// Allow any user who can view the task to upload audio (for conversations)
router.post('/audio/upload', verifyTaskViewAccess, singleTaskAttachment, taskController.uploadAudio);
// Sub-task routes (must come before /:id routes)
router.put('/sub-tasks/:id', verifyTaskUpdateAccess, taskController.updateSubTask);
router.delete('/sub-tasks/:id', verifyPermission('can_manage_tasks'), taskController.deleteSubTask);
// Message routes (must come before /:id routes)
router.put('/messages/:id/read', verifyTaskViewAccess, taskController.markMessageAsRead);
// Task-specific routes (/:id routes - must come last to avoid conflicts)
router.get('/:id/detail', verifyTaskViewAccess, taskController.getTaskDetail); // Full task detail with sub-tasks, attachments, conversation
router.get('/:id/sub-tasks', verifyTaskViewAccess, taskController.getSubTasks);
router.get('/:id/messages/unread-count', verifyTaskViewAccess, taskController.getUnreadCount);
router.get('/:id/messages', verifyTaskViewAccess, taskController.getMessages);
router.get('/:id/comments', verifyPermission('can_manage_tasks'), taskController.getTaskComments);
router.get('/:id', verifyPermission('can_manage_tasks'), taskController.getTaskById);
// Only SuperAdmin and HR Manager can create tasks
router.post('/', verifyRole(['SuperAdmin', 'HR Manager']), taskController.createTask);
router.post('/:id/sub-tasks', verifyRole(['SuperAdmin', 'HR Manager']), taskController.createSubTask);
router.post('/:id/attachments', verifyTaskUpdateAccess, singleTaskAttachment, taskController.uploadAttachment);
router.post('/:id/messages', verifyTaskViewAccess, taskController.sendMessage);
router.post('/:id/comments', verifyPermission('can_manage_tasks'), taskController.addTaskComment);
// Allow users to update their own assigned tasks (status only) OR users with can_manage_tasks permission
router.put('/:id', verifyTaskUpdateAccess, taskController.updateTask);
router.put('/:id/status', verifyTaskUpdateAccess, taskController.updateTaskStatus);
router.delete('/:id', verifyPermission('can_manage_tasks'), taskController.deleteTask);
export default router;
//# sourceMappingURL=task.routes.js.map