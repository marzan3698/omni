import { taskService } from '../services/task.service.js';
import { subTaskService } from '../services/subTask.service.js';
import { taskAttachmentService } from '../services/taskAttachment.service.js';
import { taskConversationService } from '../services/taskConversation.service.js';
import { audioService } from '../services/audio.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
// Validation schemas
const createTaskSchema = z.object({
    title: z.string().min(1, 'Task title is required'),
    description: z.string().optional(),
    priority: z.enum(['Low', 'Medium', 'High']).optional(),
    dueDate: z.string().datetime().or(z.date()).optional(),
    projectId: z.number().int().positive().optional(),
    assignedTo: z.number().int().positive().optional(),
    groupId: z.number().int().positive().optional(),
    companyId: z.number().int().positive().optional(), // Optional in schema, will be set from user context
}).refine((data) => {
    // Either groupId or assignedTo must be provided (not both, not neither)
    const hasGroupId = !!data.groupId;
    const hasAssignedTo = !!data.assignedTo;
    return hasGroupId !== hasAssignedTo; // XOR: exactly one must be true
}, {
    message: 'Task must be assigned to either an employee (assignedTo) or an employee group (groupId), but not both.',
    path: ['assignedTo', 'groupId'],
});
const updateTaskSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    priority: z.enum(['Low', 'Medium', 'High']).optional(),
    dueDate: z.string().datetime().or(z.date()).optional(),
    projectId: z.number().int().positive().nullable().optional(),
    assignedTo: z.number().int().positive().nullable().optional(),
    groupId: z.number().int().positive().nullable().optional(),
    status: z.enum(['Pending', 'StartedWorking', 'Complete', 'Cancel']).optional(),
}).refine((data) => {
    // If both assignment fields are being updated, only one can be set
    if (data.groupId !== undefined && data.assignedTo !== undefined) {
        const hasGroupId = data.groupId !== null;
        const hasAssignedTo = data.assignedTo !== null;
        return hasGroupId !== hasAssignedTo; // XOR: exactly one must be true
    }
    return true;
}, {
    message: 'Task cannot be assigned to both an employee and a group. Please choose one.',
    path: ['assignedTo', 'groupId'],
});
const createCommentSchema = z.object({
    content: z.string().min(1, 'Comment content is required'),
});
export const taskController = {
    /**
     * Get all tasks
     * GET /api/tasks?companyId=1&status=Todo&priority=High&assignedTo=1
     * SuperAdmin can see all tasks (pass null for companyId to get all)
     */
    getAllTasks: async (req, res) => {
        try {
            const authReq = req;
            const user = authReq.user;
            const isSuperAdmin = user?.role?.name === 'SuperAdmin';
            let companyId = null;
            if (!isSuperAdmin) {
                companyId = user?.companyId || parseInt(req.query.companyId);
                if (!companyId || isNaN(companyId)) {
                    return sendError(res, 'Company ID is required', 400);
                }
            }
            else {
                // SuperAdmin can optionally filter by companyId, or see all tasks
                if (req.query.companyId) {
                    companyId = parseInt(req.query.companyId);
                    if (isNaN(companyId)) {
                        return sendError(res, 'Invalid Company ID', 400);
                    }
                }
                // If no companyId provided, SuperAdmin sees all tasks (companyId = null)
            }
            const filters = {};
            if (req.query.status) {
                filters.status = req.query.status;
            }
            if (req.query.priority) {
                filters.priority = req.query.priority;
            }
            if (req.query.assignedTo) {
                filters.assignedTo = parseInt(req.query.assignedTo);
            }
            if (req.query.projectId) {
                filters.projectId = parseInt(req.query.projectId);
            }
            if (req.query.groupId) {
                filters.groupId = parseInt(req.query.groupId);
            }
            const tasks = await taskService.getAllTasks(companyId, filters);
            return sendSuccess(res, tasks, 'Tasks retrieved successfully');
        }
        catch (error) {
            console.error('Error in getAllTasks:', error);
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            console.error('Full error stack:', error.stack);
            return sendError(res, error.message || 'Failed to retrieve tasks', 500);
        }
    },
    /**
     * Get task by ID
     * GET /api/tasks/:id
     */
    getTaskById: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const companyId = parseInt(req.query.companyId || req.body.companyId);
            if (isNaN(id)) {
                return sendError(res, 'Invalid task ID', 400);
            }
            if (isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            const task = await taskService.getTaskById(id, companyId);
            return sendSuccess(res, task, 'Task retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to retrieve task', 500);
        }
    },
    /**
     * Create task
     * POST /api/tasks
     */
    createTask: async (req, res) => {
        try {
            const authReq = req;
            const user = authReq.user;
            const companyId = user?.companyId || parseInt(req.body.companyId);
            if (!companyId || isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            const validatedData = createTaskSchema.parse(req.body);
            const task = await taskService.createTask({
                companyId,
                title: validatedData.title,
                description: validatedData.description,
                priority: validatedData.priority,
                dueDate: validatedData.dueDate ? (validatedData.dueDate instanceof Date ? validatedData.dueDate : new Date(validatedData.dueDate)) : undefined,
                projectId: validatedData.projectId || undefined,
                assignedTo: validatedData.assignedTo || undefined,
                groupId: validatedData.groupId || undefined,
            });
            return sendSuccess(res, task, 'Task created successfully', 201);
        }
        catch (error) {
            console.error('Error creating task:', error);
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            console.error('Unexpected error creating task:', error);
            return sendError(res, `Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
        }
    },
    /**
     * Update task
     * PUT /api/tasks/:id
     */
    updateTask: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const companyId = parseInt(req.query.companyId || req.body.companyId);
            if (isNaN(id)) {
                return sendError(res, 'Invalid task ID', 400);
            }
            if (isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            const validatedData = updateTaskSchema.parse(req.body);
            const updateData = {
                ...validatedData,
                dueDate: validatedData.dueDate ? (validatedData.dueDate instanceof Date ? validatedData.dueDate : new Date(validatedData.dueDate)) : undefined,
            };
            // Handle nullable fields - convert null to undefined to maintain existing behavior
            if (validatedData.projectId !== undefined) {
                updateData.projectId = validatedData.projectId === null ? undefined : validatedData.projectId;
            }
            if (validatedData.assignedTo !== undefined) {
                updateData.assignedTo = validatedData.assignedTo === null ? undefined : validatedData.assignedTo;
            }
            if (validatedData.groupId !== undefined) {
                updateData.groupId = validatedData.groupId === null ? undefined : validatedData.groupId;
            }
            // If status is being updated to StartedWorking, check if it's transitioning from Pending
            if (validatedData.status === 'StartedWorking') {
                const currentTask = await prisma.task.findFirst({
                    where: { id, companyId },
                    select: { status: true, startedAt: true },
                });
                // Only set startedAt if transitioning from Pending and startedAt is not already set
                if (currentTask && currentTask.status === 'Pending' && !currentTask.startedAt) {
                    updateData.startedAt = new Date();
                }
            }
            const task = await taskService.updateTask(id, companyId, updateData);
            return sendSuccess(res, task, 'Task updated successfully');
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to update task', 500);
        }
    },
    /**
     * Delete task
     * DELETE /api/tasks/:id
     */
    deleteTask: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const companyId = parseInt(req.query.companyId || req.body.companyId);
            if (isNaN(id)) {
                return sendError(res, 'Invalid task ID', 400);
            }
            if (isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            await taskService.deleteTask(id, companyId);
            return sendSuccess(res, null, 'Task deleted successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to delete task', 500);
        }
    },
    /**
     * Update task status
     * PUT /api/tasks/:id/status
     */
    updateTaskStatus: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const companyId = parseInt(req.query.companyId || req.body.companyId);
            const status = req.body.status;
            if (isNaN(id)) {
                return sendError(res, 'Invalid task ID', 400);
            }
            if (isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            if (!status || !['Pending', 'StartedWorking', 'Complete', 'Cancel'].includes(status)) {
                return sendError(res, 'Invalid status. Must be one of: Pending, StartedWorking, Complete, Cancel', 400);
            }
            const task = await taskService.updateTaskStatus(id, companyId, status);
            return sendSuccess(res, task, 'Task status updated successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to update task status', 500);
        }
    },
    /**
     * Add task comment
     * POST /api/tasks/:id/comments
     */
    addTaskComment: async (req, res) => {
        try {
            const taskId = parseInt(req.params.id);
            const authReq = req;
            if (isNaN(taskId)) {
                return sendError(res, 'Invalid task ID', 400);
            }
            if (!authReq.user) {
                return sendError(res, 'User not authenticated', 401);
            }
            const validatedData = createCommentSchema.parse(req.body);
            const comment = await taskService.addTaskComment({
                taskId,
                userId: authReq.user.id,
                content: validatedData.content,
            });
            return sendSuccess(res, comment, 'Comment added successfully', 201);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to add comment', 500);
        }
    },
    /**
     * Get task comments
     * GET /api/tasks/:id/comments
     */
    getTaskComments: async (req, res) => {
        try {
            const taskId = parseInt(req.params.id);
            if (isNaN(taskId)) {
                return sendError(res, 'Invalid task ID', 400);
            }
            const comments = await taskService.getTaskComments(taskId);
            return sendSuccess(res, comments, 'Comments retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to retrieve comments', 500);
        }
    },
    /**
     * Get tasks for a specific user
     * GET /api/tasks/user/:userId?companyId=1
     */
    getUserTasks: async (req, res) => {
        try {
            const authReq = req;
            const user = authReq.user;
            const requestedUserId = req.params.userId;
            const companyId = parseInt(req.query.companyId);
            if (!requestedUserId) {
                return sendError(res, 'User ID is required', 400);
            }
            if (isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            // Additional validation: Ensure user can only access their own tasks unless they have permission
            // This is already checked by middleware, but adding extra safety check
            const isSuperAdmin = user?.role?.name === 'SuperAdmin';
            if (!isSuperAdmin && requestedUserId !== user?.id) {
                // Check if user has can_view_tasks permission (should have been checked by middleware)
                // But double-check here for extra security
                const userRecord = await prisma.user.findUnique({
                    where: { id: user?.id },
                    include: { role: true },
                });
                const permissions = userRecord?.role.permissions;
                if (!permissions?.['can_view_tasks']) {
                    return sendError(res, 'Permission denied: You can only view your own tasks', 403);
                }
            }
            const tasks = await taskService.getUserTasks(requestedUserId, companyId);
            return sendSuccess(res, tasks, 'User tasks retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to retrieve user tasks', 500);
        }
    },
    /**
     * Get full task detail with sub-tasks, attachments, and conversation
     * GET /api/tasks/:id/detail
     */
    getTaskDetail: async (req, res) => {
        try {
            const authReq = req;
            const user = authReq.user;
            const id = parseInt(req.params.id);
            const companyId = user?.companyId || parseInt(req.query.companyId);
            if (isNaN(id)) {
                return sendError(res, 'Invalid task ID', 400);
            }
            if (!companyId || isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            const taskDetail = await taskService.getTaskDetail(id, companyId);
            return sendSuccess(res, taskDetail, 'Task detail retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            console.error('Error getting task detail:', error);
            console.error('Error stack:', error?.stack);
            console.error('Error message:', error?.message);
            return sendError(res, error?.message || 'Failed to retrieve task detail', 500);
        }
    },
    /**
     * Create sub-task
     * POST /api/tasks/:id/sub-tasks
     */
    createSubTask: async (req, res) => {
        try {
            const authReq = req;
            const user = authReq.user;
            const taskId = parseInt(req.params.id);
            const companyId = user?.companyId || parseInt(req.body.companyId);
            if (isNaN(taskId)) {
                return sendError(res, 'Invalid task ID', 400);
            }
            if (!companyId || isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            const subTaskSchema = z.object({
                title: z.string().min(1, 'Sub-task title is required'),
                instructions: z.string().optional(),
                weight: z.number().positive().optional(),
                order: z.number().int().optional(),
            });
            const validatedData = subTaskSchema.parse(req.body);
            const subTask = await subTaskService.createSubTask({
                taskId,
                companyId,
                title: validatedData.title,
                instructions: validatedData.instructions,
                weight: validatedData.weight,
                order: validatedData.order,
            });
            return sendSuccess(res, subTask, 'Sub-task created successfully', 201);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            console.error('Error creating sub-task:', error);
            return sendError(res, 'Failed to create sub-task', 500);
        }
    },
    /**
     * Update sub-task
     * PUT /api/tasks/sub-tasks/:id
     */
    updateSubTask: async (req, res) => {
        try {
            const authReq = req;
            const user = authReq.user;
            const id = parseInt(req.params.id);
            const companyId = user?.companyId || parseInt(req.body.companyId);
            if (isNaN(id)) {
                return sendError(res, 'Invalid sub-task ID', 400);
            }
            if (!companyId || isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            const updateSubTaskSchema = z.object({
                title: z.string().min(1).optional(),
                instructions: z.string().optional(),
                weight: z.number().positive().optional(),
                order: z.number().int().optional(),
                status: z.enum(['Pending', 'StartedWorking', 'Complete', 'Cancel']).optional(),
            });
            const validatedData = updateSubTaskSchema.parse(req.body);
            const subTask = await subTaskService.updateSubTask(id, companyId, validatedData);
            return sendSuccess(res, subTask, 'Sub-task updated successfully');
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            console.error('Error updating sub-task:', error);
            return sendError(res, 'Failed to update sub-task', 500);
        }
    },
    /**
     * Delete sub-task
     * DELETE /api/tasks/sub-tasks/:id
     */
    deleteSubTask: async (req, res) => {
        try {
            const authReq = req;
            const user = authReq.user;
            const id = parseInt(req.params.id);
            const companyId = user?.companyId || parseInt(req.query.companyId);
            if (isNaN(id)) {
                return sendError(res, 'Invalid sub-task ID', 400);
            }
            if (!companyId || isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            await subTaskService.deleteSubTask(id, companyId);
            return sendSuccess(res, null, 'Sub-task deleted successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            console.error('Error deleting sub-task:', error);
            return sendError(res, 'Failed to delete sub-task', 500);
        }
    },
    /**
     * Get all sub-tasks for a task
     * GET /api/tasks/:id/sub-tasks
     */
    getSubTasks: async (req, res) => {
        try {
            const authReq = req;
            const user = authReq.user;
            const taskId = parseInt(req.params.id);
            const companyId = user?.companyId || parseInt(req.query.companyId);
            if (isNaN(taskId)) {
                return sendError(res, 'Invalid task ID', 400);
            }
            if (!companyId || isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            const subTasks = await subTaskService.getSubTasksByTaskId(taskId, companyId);
            return sendSuccess(res, subTasks, 'Sub-tasks retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            console.error('Error getting sub-tasks:', error);
            return sendError(res, 'Failed to retrieve sub-tasks', 500);
        }
    },
    /**
     * Upload attachment (file)
     * POST /api/tasks/:id/attachments
     */
    uploadAttachment: async (req, res) => {
        try {
            const authReq = req;
            const user = authReq.user;
            // Get taskId from params (route is /tasks/:id/attachments)
            const taskIdParam = req.params.id ? parseInt(req.params.id) : NaN;
            const taskIdBody = req.body.taskId ? parseInt(req.body.taskId) : NaN;
            const taskId = !isNaN(taskIdParam) ? taskIdParam : !isNaN(taskIdBody) ? taskIdBody : NaN;
            const subTaskId = req.body.subTaskId ? parseInt(req.body.subTaskId) : undefined;
            const companyId = user?.companyId || (req.body.companyId ? parseInt(req.body.companyId) : NaN);
            if (!req.file) {
                return sendError(res, 'No file uploaded', 400);
            }
            if (isNaN(taskId)) {
                return sendError(res, 'Task ID is required', 400);
            }
            if (!companyId || isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            if (!user?.id) {
                return sendError(res, 'User ID is required', 400);
            }
            // Determine file type from MIME type
            let fileType = 'image';
            const mimeType = req.file.mimetype;
            if (mimeType.startsWith('image/')) {
                fileType = 'image';
            }
            else if (mimeType === 'application/pdf') {
                fileType = 'pdf';
            }
            else if (mimeType.startsWith('video/')) {
                fileType = 'video';
            }
            else if (mimeType.startsWith('audio/')) {
                fileType = 'audio';
            }
            // Generate relative URL
            const relativePath = subTaskId
                ? `tasks/subtask-${subTaskId}/attachments/${req.file.filename}`
                : `tasks/task-${taskId}/attachments/${req.file.filename}`;
            const fileUrl = `/uploads/${relativePath}`;
            const attachment = await taskAttachmentService.createAttachment({
                taskId: subTaskId ? undefined : taskId,
                subTaskId,
                companyId,
                fileType,
                fileUrl,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                createdBy: user.id,
            });
            return sendSuccess(res, attachment, 'Attachment uploaded successfully', 201);
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            console.error('Error uploading attachment:', error);
            console.error('Error message:', error?.message);
            console.error('Error stack:', error?.stack);
            return sendError(res, `Failed to upload attachment: ${error?.message || 'Unknown error'}`, 500);
        }
    },
    /**
     * Add link attachment
     * POST /api/tasks/attachments/link
     */
    addLinkAttachment: async (req, res) => {
        try {
            const authReq = req;
            const user = authReq.user;
            const companyId = user?.companyId || parseInt(req.body.companyId);
            if (!companyId || isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            if (!user?.id) {
                return sendError(res, 'User ID is required', 400);
            }
            const linkSchema = z.object({
                taskId: z.number().int().positive().optional(),
                subTaskId: z.number().int().positive().optional(),
                linkUrl: z.string().url('Invalid URL format'),
                linkTitle: z.string().optional(),
                linkDescription: z.string().optional(),
                thumbnailUrl: z.string().url().optional(),
            }).refine((data) => {
                return !!data.taskId !== !!data.subTaskId; // XOR: exactly one must be true
            }, {
                message: 'Either taskId or subTaskId must be provided, but not both.',
                path: ['taskId', 'subTaskId'],
            });
            const validatedData = linkSchema.parse(req.body);
            const attachment = await taskAttachmentService.createLinkAttachment({
                taskId: validatedData.taskId,
                subTaskId: validatedData.subTaskId,
                linkUrl: validatedData.linkUrl,
                linkTitle: validatedData.linkTitle,
                linkDescription: validatedData.linkDescription,
                thumbnailUrl: validatedData.thumbnailUrl,
                companyId,
                createdBy: user.id,
            });
            return sendSuccess(res, attachment, 'Link attachment added successfully', 201);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            console.error('Error adding link attachment:', error);
            return sendError(res, 'Failed to add link attachment', 500);
        }
    },
    /**
     * Delete attachment
     * DELETE /api/tasks/attachments/:id
     */
    deleteAttachment: async (req, res) => {
        try {
            const authReq = req;
            const user = authReq.user;
            const id = parseInt(req.params.id);
            const companyId = user?.companyId || parseInt(req.query.companyId);
            if (isNaN(id)) {
                return sendError(res, 'Invalid attachment ID', 400);
            }
            if (!companyId || isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            await taskAttachmentService.deleteAttachment(id, companyId);
            return sendSuccess(res, null, 'Attachment deleted successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            console.error('Error deleting attachment:', error);
            return sendError(res, 'Failed to delete attachment', 500);
        }
    },
    /**
     * Upload audio recording
     * POST /api/tasks/audio/upload
     */
    uploadAudio: async (req, res) => {
        try {
            const authReq = req;
            const user = authReq.user;
            const companyId = user?.companyId || parseInt(req.body.companyId);
            if (!companyId || isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            if (!user?.id) {
                return sendError(res, 'User ID is required', 400);
            }
            if (!req.file) {
                return sendError(res, 'No audio file uploaded', 400);
            }
            // Validate it's an audio file
            if (!req.file.mimetype.startsWith('audio/')) {
                return sendError(res, 'Invalid file type. Only audio files are allowed.', 400);
            }
            // Parse FormData fields (they come as strings, so we need to convert to numbers)
            const audioSchema = z.object({
                taskId: z.preprocess((val) => {
                    if (val === undefined || val === null || val === '')
                        return undefined;
                    const num = typeof val === 'string' ? parseInt(val, 10) : val;
                    return isNaN(num) ? undefined : num;
                }, z.number().int().positive().optional()),
                subTaskId: z.preprocess((val) => {
                    if (val === undefined || val === null || val === '')
                        return undefined;
                    const num = typeof val === 'string' ? parseInt(val, 10) : val;
                    return isNaN(num) ? undefined : num;
                }, z.number().int().positive().optional()),
                duration: z.preprocess((val) => {
                    if (val === undefined || val === null || val === '')
                        return undefined;
                    const num = typeof val === 'string' ? parseFloat(val) : val;
                    return isNaN(num) ? undefined : num;
                }, z.number().optional()),
            }).refine((data) => {
                return !!data.taskId !== !!data.subTaskId; // XOR: exactly one must be true
            }, {
                message: 'Either taskId or subTaskId must be provided, but not both.',
                path: ['taskId', 'subTaskId'],
            });
            const validatedData = audioSchema.parse(req.body);
            // Read audio file - handle both memory storage (buffer) and disk storage (path)
            let audioBlob;
            if (req.file.buffer) {
                // Memory storage (multer.memoryStorage)
                audioBlob = req.file.buffer;
            }
            else if (req.file.path) {
                // Disk storage (multer.diskStorage) - read file from disk
                const fs = await import('fs');
                audioBlob = fs.readFileSync(req.file.path);
                // Clean up temporary file if it was saved to a temp location
                // (The audio service will save it to the final location)
                if (req.file.path.includes('temp')) {
                    try {
                        fs.unlinkSync(req.file.path);
                    }
                    catch (error) {
                        console.warn('Failed to delete temp audio file:', error);
                    }
                }
            }
            else {
                return sendError(res, 'No audio file data available', 400);
            }
            // Upload audio using audio service
            const { fileUrl, fileName, fileSize } = await audioService.uploadAudio({
                taskId: validatedData.taskId,
                subTaskId: validatedData.subTaskId,
                companyId,
                audioBlob,
                mimeType: req.file.mimetype,
                duration: validatedData.duration,
                createdBy: user.id,
            });
            // Create attachment record
            const attachment = await taskAttachmentService.createAttachment({
                taskId: validatedData.taskId,
                subTaskId: validatedData.subTaskId,
                companyId,
                fileType: 'audio',
                fileUrl,
                fileName,
                fileSize,
                mimeType: req.file.mimetype,
                duration: validatedData.duration,
                createdBy: user.id,
            });
            return sendSuccess(res, attachment, 'Audio uploaded successfully', 201);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            console.error('Error uploading audio:', error);
            return sendError(res, 'Failed to upload audio', 500);
        }
    },
    /**
     * Send message in task conversation
     * POST /api/tasks/:id/messages
     */
    sendMessage: async (req, res) => {
        try {
            const authReq = req;
            const user = authReq.user;
            const taskId = parseInt(req.params.id);
            const companyId = user?.companyId || parseInt(req.body.companyId);
            if (isNaN(taskId)) {
                return sendError(res, 'Invalid task ID', 400);
            }
            if (!companyId || isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            if (!user?.id) {
                return sendError(res, 'User ID is required', 400);
            }
            // Get or create conversation
            let conversation = await taskConversationService.getConversationByTaskId(taskId, companyId);
            if (!conversation) {
                conversation = await taskConversationService.createConversation({
                    taskId,
                    companyId,
                });
            }
            if (!conversation) {
                return sendError(res, 'Failed to get or create conversation', 500);
            }
            const conversationId = conversation.id;
            const messageSchema = z.object({
                content: z.string().optional(),
                messageType: z.enum(['text', 'image', 'file', 'audio', 'system']).optional(),
                attachmentId: z.number().int().positive().optional(),
            });
            const validatedData = messageSchema.parse(req.body);
            const message = await taskConversationService.sendMessage({
                conversationId,
                senderId: user.id,
                content: validatedData.content,
                messageType: validatedData.messageType || 'text',
                attachmentId: validatedData.attachmentId,
            });
            return sendSuccess(res, message, 'Message sent successfully', 201);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            console.error('Error sending message:', error);
            return sendError(res, 'Failed to send message', 500);
        }
    },
    /**
     * Get task conversation messages
     * GET /api/tasks/:id/messages?page=1&limit=50
     */
    getMessages: async (req, res) => {
        try {
            const authReq = req;
            const user = authReq.user;
            const taskId = parseInt(req.params.id);
            const companyId = user?.companyId || parseInt(req.query.companyId);
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            if (isNaN(taskId)) {
                return sendError(res, 'Invalid task ID', 400);
            }
            if (!companyId || isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            // Get conversation
            const conversation = await taskConversationService.getConversationByTaskId(taskId, companyId);
            if (!conversation || !conversation.id) {
                return sendSuccess(res, { messages: [], pagination: { page, limit, total: 0, totalPages: 0 } }, 'No conversation found', 200);
            }
            const conversationId = conversation.id;
            const result = await taskConversationService.getMessages(conversationId, companyId, page, limit);
            // Mark all messages as read for current user
            if (user?.id) {
                await taskConversationService.markAllAsRead(conversationId, user.id, companyId);
            }
            return sendSuccess(res, result, 'Messages retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            console.error('Error getting messages:', error);
            return sendError(res, 'Failed to retrieve messages', 500);
        }
    },
    /**
     * Mark message as read
     * PUT /api/tasks/messages/:id/read
     */
    markMessageAsRead: async (req, res) => {
        try {
            const authReq = req;
            const user = authReq.user;
            const messageId = parseInt(req.params.id);
            const companyId = user?.companyId || parseInt(req.query.companyId);
            if (isNaN(messageId)) {
                return sendError(res, 'Invalid message ID', 400);
            }
            if (!companyId || isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            if (!user?.id) {
                return sendError(res, 'User ID is required', 400);
            }
            const message = await taskConversationService.markAsRead(messageId, user.id, companyId);
            return sendSuccess(res, message, 'Message marked as read');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            console.error('Error marking message as read:', error);
            return sendError(res, 'Failed to mark message as read', 500);
        }
    },
    /**
     * Get unread message count for task conversation
     * GET /api/tasks/:id/messages/unread-count
     */
    getUnreadCount: async (req, res) => {
        try {
            const authReq = req;
            const user = authReq.user;
            const taskId = parseInt(req.params.id);
            const companyId = user?.companyId || parseInt(req.query.companyId);
            if (isNaN(taskId)) {
                return sendError(res, 'Invalid task ID', 400);
            }
            if (!companyId || isNaN(companyId)) {
                return sendError(res, 'Company ID is required', 400);
            }
            if (!user?.id) {
                return sendError(res, 'User ID is required', 400);
            }
            // Get conversation
            const conversation = await taskConversationService.getConversationByTaskId(taskId, companyId);
            if (!conversation) {
                return sendSuccess(res, { count: 0 }, 'No conversation found');
            }
            const count = await taskConversationService.getUnreadCount(conversation.id, user.id, companyId);
            return sendSuccess(res, { count }, 'Unread count retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            console.error('Error getting unread count:', error);
            return sendError(res, 'Failed to retrieve unread count', 500);
        }
    },
};
//# sourceMappingURL=task.controller.js.map