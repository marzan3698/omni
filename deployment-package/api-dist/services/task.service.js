import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { taskConversationService } from './taskConversation.service.js';
import { subTaskService } from './subTask.service.js';
import { taskAttachmentService } from './taskAttachment.service.js';
export const taskService = {
    /**
     * Get all tasks for a company
     * If companyId is null, returns all tasks (for SuperAdmin)
     */
    async getAllTasks(companyId, filters) {
        const whereClause = {};
        // Only filter by companyId if provided (null means all companies for SuperAdmin)
        if (companyId !== null) {
            whereClause.companyId = companyId;
        }
        // Add other filters
        if (filters?.status) {
            whereClause.status = filters.status;
        }
        if (filters?.priority) {
            whereClause.priority = filters.priority;
        }
        if (filters?.assignedTo) {
            whereClause.assignedTo = filters.assignedTo;
        }
        if (filters?.projectId) {
            whereClause.projectId = filters.projectId;
        }
        if (filters?.groupId) {
            whereClause.groupId = filters.groupId;
        }
        return await prisma.task.findMany({
            where: whereClause,
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                    },
                },
                assignedEmployee: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                profileImage: true,
                            },
                        },
                    },
                },
                group: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
                comments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                profileImage: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: {
                        comments: true,
                        subTasks: true,
                        attachments: true,
                    },
                },
                conversation: {
                    select: {
                        id: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    },
    /**
     * Get task by ID
     */
    async getTaskById(id, companyId) {
        const task = await prisma.task.findFirst({
            where: {
                id,
                companyId,
            },
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                    },
                },
                assignedEmployee: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                profileImage: true,
                                role: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                group: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
                comments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                profileImage: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!task) {
            throw new AppError('Task not found', 404);
        }
        return task;
    },
    /**
     * Create task
     */
    async createTask(data) {
        // Validation: Either groupId or assignedTo must be provided (not both, not neither)
        if (!data.groupId && !data.assignedTo) {
            throw new AppError('Task must be assigned to either an employee or an employee group', 400);
        }
        if (data.groupId && data.assignedTo) {
            throw new AppError('Task cannot be assigned to both an employee and a group. Please choose one.', 400);
        }
        // Verify project exists if provided
        if (data.projectId) {
            const project = await prisma.project.findFirst({
                where: {
                    id: data.projectId,
                    companyId: data.companyId,
                },
            });
            if (!project) {
                throw new AppError('Project not found', 404);
            }
        }
        // Verify assigned employee if provided
        if (data.assignedTo) {
            const employee = await prisma.employee.findFirst({
                where: {
                    id: data.assignedTo,
                    companyId: data.companyId,
                },
            });
            if (!employee) {
                throw new AppError('Employee not found', 404);
            }
        }
        // Verify group exists and belongs to company if provided
        if (data.groupId) {
            const group = await prisma.employeeGroup.findFirst({
                where: {
                    id: data.groupId,
                    companyId: data.companyId,
                },
                include: {
                    members: {
                        take: 1,
                    },
                },
            });
            if (!group) {
                throw new AppError('Employee group not found', 404);
            }
            if (group.members.length === 0) {
                throw new AppError('Employee group must have at least one member', 400);
            }
        }
        try {
            const task = await prisma.task.create({
                data: {
                    companyId: data.companyId,
                    title: data.title,
                    description: data.description,
                    priority: data.priority || 'Medium',
                    dueDate: data.dueDate,
                    projectId: data.projectId,
                    assignedTo: data.assignedTo,
                    groupId: data.groupId,
                    status: 'Pending', // Always set to Pending on creation
                    progress: 0.0, // Initialize progress to 0
                },
                include: {
                    project: {
                        select: {
                            id: true,
                            title: true,
                            status: true,
                        },
                    },
                    assignedEmployee: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    profileImage: true,
                                },
                            },
                        },
                    },
                    group: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                        },
                    },
                },
            });
            // Automatically create conversation for the task
            try {
                const conversation = await taskConversationService.createConversation({
                    taskId: task.id,
                    companyId: data.companyId,
                });
                // Update task with conversation_id
                const updatedTask = await prisma.task.update({
                    where: { id: task.id },
                    data: {
                        conversationId: conversation.id,
                    },
                    include: {
                        project: {
                            select: {
                                id: true,
                                title: true,
                                status: true,
                            },
                        },
                        assignedEmployee: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        email: true,
                                        profileImage: true,
                                    },
                                },
                            },
                        },
                        group: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                            },
                        },
                        conversation: {
                            include: {
                                messages: {
                                    take: 0, // Don't load messages in list view
                                },
                            },
                        },
                    },
                });
                return updatedTask;
            }
            catch (convError) {
                console.error('Error creating conversation for task:', convError);
                // Continue without conversation if creation fails
                return task;
            }
        }
        catch (error) {
            console.error('Prisma error creating task:', error);
            // If error is about enum value, provide helpful message
            if (error.code === 'P2002' || error.message?.includes('enum') || error.message?.includes('Pending')) {
                throw new AppError('Database schema mismatch. Please ensure migrations have been run. Error: ' + error.message, 500);
            }
            throw error;
        }
    },
    /**
     * Update task
     */
    async updateTask(id, companyId, data) {
        const task = await prisma.task.findFirst({
            where: {
                id,
                companyId,
            },
        });
        if (!task) {
            throw new AppError('Task not found', 404);
        }
        // Validation: Either groupId or assignedTo must be provided (if assignment is being updated)
        if (data.groupId !== undefined || data.assignedTo !== undefined) {
            const finalGroupId = data.groupId !== undefined ? data.groupId : task.groupId;
            const finalAssignedTo = data.assignedTo !== undefined ? data.assignedTo : task.assignedTo;
            if (!finalGroupId && !finalAssignedTo) {
                throw new AppError('Task must be assigned to either an employee or an employee group', 400);
            }
            if (finalGroupId && finalAssignedTo) {
                throw new AppError('Task cannot be assigned to both an employee and a group. Please choose one.', 400);
            }
        }
        // Verify project exists if provided
        if (data.projectId !== undefined) {
            if (data.projectId) {
                const project = await prisma.project.findFirst({
                    where: {
                        id: data.projectId,
                        companyId,
                    },
                });
                if (!project) {
                    throw new AppError('Project not found', 404);
                }
            }
        }
        // Verify assigned employee if provided
        if (data.assignedTo !== undefined && data.assignedTo) {
            const employee = await prisma.employee.findFirst({
                where: {
                    id: data.assignedTo,
                    companyId,
                },
            });
            if (!employee) {
                throw new AppError('Employee not found', 404);
            }
        }
        // Verify group exists and belongs to company if provided
        if (data.groupId !== undefined && data.groupId) {
            const group = await prisma.employeeGroup.findFirst({
                where: {
                    id: data.groupId,
                    companyId,
                },
                include: {
                    members: {
                        take: 1,
                    },
                },
            });
            if (!group) {
                throw new AppError('Employee group not found', 404);
            }
            if (group.members.length === 0) {
                throw new AppError('Employee group must have at least one member', 400);
            }
        }
        // If changing status to StartedWorking from Pending, set startedAt if not already set
        const updateData = { ...data };
        if (data.status === 'StartedWorking' && task.status === 'Pending' && !task.startedAt) {
            updateData.startedAt = new Date();
        }
        const updatedTask = await prisma.task.update({
            where: { id },
            data: updateData,
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                    },
                },
                assignedEmployee: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                profileImage: true,
                            },
                        },
                    },
                },
                group: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
            },
        });
        // Recalculate progress if status changed or sub-tasks exist
        if (data.status || data.status !== task.status) {
            await subTaskService.calculateTaskProgress(id, companyId);
        }
        return updatedTask;
    },
    /**
     * Delete task
     */
    async deleteTask(id, companyId) {
        const task = await prisma.task.findFirst({
            where: {
                id,
                companyId,
            },
        });
        if (!task) {
            throw new AppError('Task not found', 404);
        }
        return await prisma.task.delete({
            where: { id },
        });
    },
    /**
     * Update task status
     */
    async updateTaskStatus(id, companyId, status) {
        const task = await prisma.task.findFirst({
            where: {
                id,
                companyId,
            },
        });
        if (!task) {
            throw new AppError('Task not found', 404);
        }
        // If changing status to StartedWorking from Pending, set startedAt if not already set
        const updateData = { status };
        if (status === 'StartedWorking' && task.status === 'Pending' && !task.startedAt) {
            updateData.startedAt = new Date();
        }
        const updatedTask = await prisma.task.update({
            where: { id },
            data: updateData,
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                    },
                },
                assignedEmployee: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                profileImage: true,
                            },
                        },
                    },
                },
                group: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
            },
        });
        // Recalculate progress if sub-tasks exist
        await subTaskService.calculateTaskProgress(id, companyId);
        return updatedTask;
    },
    /**
     * Get full task detail with sub-tasks, attachments, and conversation
     */
    async getTaskDetail(id, companyId) {
        try {
            const task = await prisma.task.findFirst({
                where: {
                    id,
                    companyId,
                },
                include: {
                    project: {
                        select: {
                            id: true,
                            title: true,
                            status: true,
                        },
                    },
                    assignedEmployee: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    name: true,
                                    profileImage: true,
                                },
                            },
                        },
                    },
                    group: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                        },
                    },
                    comments: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    name: true,
                                    profileImage: true,
                                },
                            },
                        },
                        orderBy: {
                            createdAt: 'desc',
                        },
                    },
                },
            });
            if (!task) {
                throw new AppError('Task not found', 404);
            }
            // Get sub-tasks
            const subTasks = await subTaskService.getSubTasksByTaskId(id, companyId);
            // Get main task attachments (not sub-task attachments)
            const attachments = await taskAttachmentService.getAttachmentsByTaskId(id, companyId);
            // Serialize Decimal and BigInt values for JSON response
            const serializedSubTasks = subTasks.map((st) => ({
                ...st,
                weight: typeof st.weight === 'object' && st.weight !== null ? Number(st.weight) : st.weight,
                attachments: st.attachments?.map((att) => ({
                    ...att,
                    fileSize: att.fileSize ? Number(att.fileSize) : att.fileSize,
                })) || [],
            }));
            const serializedAttachments = attachments.map((att) => ({
                ...att,
                fileSize: att.fileSize ? Number(att.fileSize) : att.fileSize,
            }));
            // Return task with sub-tasks and attachments
            return {
                ...task,
                progress: typeof task.progress === 'object' && task.progress !== null ? Number(task.progress) : task.progress,
                subTasks: serializedSubTasks,
                attachments: serializedAttachments,
            };
        }
        catch (error) {
            console.error('Error in getTaskDetail:', error);
            console.error('Error message:', error?.message);
            console.error('Error stack:', error?.stack);
            throw error;
        }
    },
    /**
     * Update task progress manually (for flexibility)
     */
    async updateProgress(id, companyId, progress) {
        if (progress < 0 || progress > 100) {
            throw new AppError('Progress must be between 0 and 100', 400);
        }
        const task = await prisma.task.findFirst({
            where: {
                id,
                companyId,
            },
        });
        if (!task) {
            throw new AppError('Task not found', 404);
        }
        const updatedTask = await prisma.task.update({
            where: { id },
            data: {
                progress,
            },
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                    },
                },
                assignedEmployee: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                profileImage: true,
                            },
                        },
                    },
                },
                group: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
            },
        });
        return updatedTask;
    },
    /**
     * Add task comment
     */
    async addTaskComment(data) {
        // Verify task exists
        const task = await prisma.task.findUnique({
            where: { id: data.taskId },
        });
        if (!task) {
            throw new AppError('Task not found', 404);
        }
        // Verify user exists
        const user = await prisma.user.findUnique({
            where: { id: data.userId },
        });
        if (!user) {
            throw new AppError('User not found', 404);
        }
        return await prisma.taskComment.create({
            data: {
                taskId: data.taskId,
                userId: data.userId,
                content: data.content,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        profileImage: true,
                    },
                },
            },
        });
    },
    /**
     * Get task comments
     */
    async getTaskComments(taskId) {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
        });
        if (!task) {
            throw new AppError('Task not found', 404);
        }
        return await prisma.taskComment.findMany({
            where: { taskId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        profileImage: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    },
    /**
     * Get tasks assigned to a specific user (for dashboard)
     * Includes tasks assigned directly to the user AND tasks assigned to groups the user belongs to
     */
    async getUserTasks(userId, companyId) {
        // Find employee for this user
        const employee = await prisma.employee.findFirst({
            where: {
                userId,
                companyId,
            },
            include: {
                groups: {
                    select: {
                        groupId: true,
                    },
                },
            },
        });
        if (!employee) {
            return []; // User has no employee record, so no tasks
        }
        // Get group IDs the employee belongs to
        const groupIds = employee.groups.map((g) => g.groupId);
        // Build where clause: tasks assigned directly to employee OR tasks assigned to groups employee belongs to
        const orConditions = [
            {
                assignedTo: employee.id,
            },
        ];
        // Add group assignments if employee belongs to any groups
        if (groupIds.length > 0) {
            orConditions.push({
                groupId: {
                    in: groupIds,
                },
            });
        }
        const whereClause = {
            companyId,
            OR: orConditions,
        };
        return await prisma.task.findMany({
            where: whereClause,
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                    },
                },
                assignedEmployee: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                profileImage: true,
                            },
                        },
                    },
                },
                group: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
            },
            orderBy: [
                { status: 'asc' }, // StartedWorking first, then Complete, then Cancel
                { dueDate: 'asc' }, // Then by due date
                { createdAt: 'desc' }, // Then by creation date
            ],
        });
    },
    /**
     * Assign task to user (SuperAdmin can assign to any employee)
     */
    async assignTaskToUser(taskId, employeeId, companyId) {
        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                companyId,
            },
        });
        if (!task) {
            throw new AppError('Task not found', 404);
        }
        // Verify employee exists (SuperAdmin can assign to any employee in the company)
        const employee = await prisma.employee.findFirst({
            where: {
                id: employeeId,
                companyId,
            },
        });
        if (!employee) {
            throw new AppError('Employee not found', 404);
        }
        return await prisma.task.update({
            where: { id: taskId },
            data: { assignedTo: employeeId },
            include: {
                assignedEmployee: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                profileImage: true,
                                role: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    },
};
//# sourceMappingURL=task.service.js.map