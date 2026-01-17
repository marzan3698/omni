import { Request, Response } from 'express';
export declare const taskController: {
    /**
     * Get all tasks
     * GET /api/tasks?companyId=1&status=Todo&priority=High&assignedTo=1
     * SuperAdmin can see all tasks (pass null for companyId to get all)
     */
    getAllTasks: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get task by ID
     * GET /api/tasks/:id
     */
    getTaskById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Create task
     * POST /api/tasks
     */
    createTask: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Update task
     * PUT /api/tasks/:id
     */
    updateTask: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Delete task
     * DELETE /api/tasks/:id
     */
    deleteTask: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Update task status
     * PUT /api/tasks/:id/status
     */
    updateTaskStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Add task comment
     * POST /api/tasks/:id/comments
     */
    addTaskComment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get task comments
     * GET /api/tasks/:id/comments
     */
    getTaskComments: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get tasks for a specific user
     * GET /api/tasks/user/:userId?companyId=1
     */
    getUserTasks: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get full task detail with sub-tasks, attachments, and conversation
     * GET /api/tasks/:id/detail
     */
    getTaskDetail: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Create sub-task
     * POST /api/tasks/:id/sub-tasks
     */
    createSubTask: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Update sub-task
     * PUT /api/tasks/sub-tasks/:id
     */
    updateSubTask: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Delete sub-task
     * DELETE /api/tasks/sub-tasks/:id
     */
    deleteSubTask: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get all sub-tasks for a task
     * GET /api/tasks/:id/sub-tasks
     */
    getSubTasks: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Upload attachment (file)
     * POST /api/tasks/:id/attachments
     */
    uploadAttachment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Add link attachment
     * POST /api/tasks/attachments/link
     */
    addLinkAttachment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Delete attachment
     * DELETE /api/tasks/attachments/:id
     */
    deleteAttachment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Upload audio recording
     * POST /api/tasks/audio/upload
     */
    uploadAudio: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Send message in task conversation
     * POST /api/tasks/:id/messages
     */
    sendMessage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get task conversation messages
     * GET /api/tasks/:id/messages?page=1&limit=50
     */
    getMessages: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Mark message as read
     * PUT /api/tasks/messages/:id/read
     */
    markMessageAsRead: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get unread message count for task conversation
     * GET /api/tasks/:id/messages/unread-count
     */
    getUnreadCount: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=task.controller.d.ts.map