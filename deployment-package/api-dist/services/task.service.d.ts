import { TaskPriority, TaskStatus } from '@prisma/client';
interface CreateTaskData {
    companyId: number;
    title: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: Date;
    projectId?: number;
    assignedTo?: number;
    groupId?: number;
}
interface UpdateTaskData {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: Date;
    projectId?: number;
    assignedTo?: number;
    groupId?: number;
    status?: TaskStatus;
}
interface CreateTaskCommentData {
    taskId: number;
    userId: string;
    content: string;
}
export declare const taskService: {
    /**
     * Get all tasks for a company
     * If companyId is null, returns all tasks (for SuperAdmin)
     */
    getAllTasks(companyId: number | null, filters?: {
        status?: TaskStatus;
        priority?: TaskPriority;
        assignedTo?: number;
        projectId?: number;
        groupId?: number;
    }): Promise<({
        project: {
            status: import(".prisma/client").$Enums.ProjectStatus;
            id: number;
            title: string;
        } | null;
        _count: {
            subTasks: number;
            comments: number;
            attachments: number;
        };
        assignedEmployee: ({
            user: {
                id: string;
                email: string;
                profileImage: string | null;
            };
        } & {
            department: string | null;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            companyId: number;
            userId: string;
            departmentId: number | null;
            designation: string | null;
            salary: import("@prisma/client/runtime/library.js").Decimal | null;
            workHours: import("@prisma/client/runtime/library.js").Decimal | null;
            holidays: number | null;
            bonus: import("@prisma/client/runtime/library.js").Decimal | null;
            responsibilities: string | null;
            joinDate: Date | null;
        }) | null;
        group: {
            id: number;
            name: string;
            description: string;
        } | null;
        conversation: {
            id: number;
        } | null;
        comments: ({
            user: {
                id: string;
                email: string;
                profileImage: string | null;
            };
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            content: string;
            taskId: number;
        })[];
    } & {
        status: import(".prisma/client").$Enums.TaskStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string;
        description: string | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        dueDate: Date | null;
        projectId: number | null;
        assignedTo: number | null;
        groupId: number | null;
        startedAt: Date | null;
        progress: import("@prisma/client/runtime/library.js").Decimal | null;
        conversationId: number | null;
    })[]>;
    /**
     * Get task by ID
     */
    getTaskById(id: number, companyId: number): Promise<{
        project: {
            status: import(".prisma/client").$Enums.ProjectStatus;
            id: number;
            title: string;
        } | null;
        assignedEmployee: ({
            user: {
                role: {
                    id: number;
                    name: string;
                };
                id: string;
                email: string;
                profileImage: string | null;
            };
        } & {
            department: string | null;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            companyId: number;
            userId: string;
            departmentId: number | null;
            designation: string | null;
            salary: import("@prisma/client/runtime/library.js").Decimal | null;
            workHours: import("@prisma/client/runtime/library.js").Decimal | null;
            holidays: number | null;
            bonus: import("@prisma/client/runtime/library.js").Decimal | null;
            responsibilities: string | null;
            joinDate: Date | null;
        }) | null;
        group: {
            id: number;
            name: string;
            description: string;
        } | null;
        comments: ({
            user: {
                id: string;
                email: string;
                profileImage: string | null;
            };
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            content: string;
            taskId: number;
        })[];
    } & {
        status: import(".prisma/client").$Enums.TaskStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string;
        description: string | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        dueDate: Date | null;
        projectId: number | null;
        assignedTo: number | null;
        groupId: number | null;
        startedAt: Date | null;
        progress: import("@prisma/client/runtime/library.js").Decimal | null;
        conversationId: number | null;
    }>;
    /**
     * Create task
     */
    createTask(data: CreateTaskData): Promise<{
        project: {
            status: import(".prisma/client").$Enums.ProjectStatus;
            id: number;
            title: string;
        } | null;
        assignedEmployee: ({
            user: {
                id: string;
                email: string;
                profileImage: string | null;
            };
        } & {
            department: string | null;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            companyId: number;
            userId: string;
            departmentId: number | null;
            designation: string | null;
            salary: import("@prisma/client/runtime/library.js").Decimal | null;
            workHours: import("@prisma/client/runtime/library.js").Decimal | null;
            holidays: number | null;
            bonus: import("@prisma/client/runtime/library.js").Decimal | null;
            responsibilities: string | null;
            joinDate: Date | null;
        }) | null;
        group: {
            id: number;
            name: string;
            description: string;
        } | null;
    } & {
        status: import(".prisma/client").$Enums.TaskStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string;
        description: string | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        dueDate: Date | null;
        projectId: number | null;
        assignedTo: number | null;
        groupId: number | null;
        startedAt: Date | null;
        progress: import("@prisma/client/runtime/library.js").Decimal | null;
        conversationId: number | null;
    }>;
    /**
     * Update task
     */
    updateTask(id: number, companyId: number, data: UpdateTaskData): Promise<{
        project: {
            status: import(".prisma/client").$Enums.ProjectStatus;
            id: number;
            title: string;
        } | null;
        assignedEmployee: ({
            user: {
                id: string;
                email: string;
                profileImage: string | null;
            };
        } & {
            department: string | null;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            companyId: number;
            userId: string;
            departmentId: number | null;
            designation: string | null;
            salary: import("@prisma/client/runtime/library.js").Decimal | null;
            workHours: import("@prisma/client/runtime/library.js").Decimal | null;
            holidays: number | null;
            bonus: import("@prisma/client/runtime/library.js").Decimal | null;
            responsibilities: string | null;
            joinDate: Date | null;
        }) | null;
        group: {
            id: number;
            name: string;
            description: string;
        } | null;
    } & {
        status: import(".prisma/client").$Enums.TaskStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string;
        description: string | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        dueDate: Date | null;
        projectId: number | null;
        assignedTo: number | null;
        groupId: number | null;
        startedAt: Date | null;
        progress: import("@prisma/client/runtime/library.js").Decimal | null;
        conversationId: number | null;
    }>;
    /**
     * Delete task
     */
    deleteTask(id: number, companyId: number): Promise<{
        status: import(".prisma/client").$Enums.TaskStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string;
        description: string | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        dueDate: Date | null;
        projectId: number | null;
        assignedTo: number | null;
        groupId: number | null;
        startedAt: Date | null;
        progress: import("@prisma/client/runtime/library.js").Decimal | null;
        conversationId: number | null;
    }>;
    /**
     * Update task status
     */
    updateTaskStatus(id: number, companyId: number, status: TaskStatus): Promise<{
        project: {
            status: import(".prisma/client").$Enums.ProjectStatus;
            id: number;
            title: string;
        } | null;
        assignedEmployee: ({
            user: {
                id: string;
                email: string;
                profileImage: string | null;
            };
        } & {
            department: string | null;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            companyId: number;
            userId: string;
            departmentId: number | null;
            designation: string | null;
            salary: import("@prisma/client/runtime/library.js").Decimal | null;
            workHours: import("@prisma/client/runtime/library.js").Decimal | null;
            holidays: number | null;
            bonus: import("@prisma/client/runtime/library.js").Decimal | null;
            responsibilities: string | null;
            joinDate: Date | null;
        }) | null;
        group: {
            id: number;
            name: string;
            description: string;
        } | null;
    } & {
        status: import(".prisma/client").$Enums.TaskStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string;
        description: string | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        dueDate: Date | null;
        projectId: number | null;
        assignedTo: number | null;
        groupId: number | null;
        startedAt: Date | null;
        progress: import("@prisma/client/runtime/library.js").Decimal | null;
        conversationId: number | null;
    }>;
    /**
     * Get full task detail with sub-tasks, attachments, and conversation
     */
    getTaskDetail(id: number, companyId: number): Promise<{
        progress: number | null;
        subTasks: any[];
        attachments: any[];
        project: {
            status: import(".prisma/client").$Enums.ProjectStatus;
            id: number;
            title: string;
        } | null;
        assignedEmployee: ({
            user: {
                id: string;
                name: string | null;
                email: string;
                profileImage: string | null;
            };
        } & {
            department: string | null;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            companyId: number;
            userId: string;
            departmentId: number | null;
            designation: string | null;
            salary: import("@prisma/client/runtime/library.js").Decimal | null;
            workHours: import("@prisma/client/runtime/library.js").Decimal | null;
            holidays: number | null;
            bonus: import("@prisma/client/runtime/library.js").Decimal | null;
            responsibilities: string | null;
            joinDate: Date | null;
        }) | null;
        group: {
            id: number;
            name: string;
            description: string;
        } | null;
        comments: ({
            user: {
                id: string;
                name: string | null;
                email: string;
                profileImage: string | null;
            };
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            content: string;
            taskId: number;
        })[];
        status: import(".prisma/client").$Enums.TaskStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string;
        description: string | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        dueDate: Date | null;
        projectId: number | null;
        assignedTo: number | null;
        groupId: number | null;
        startedAt: Date | null;
        conversationId: number | null;
    }>;
    /**
     * Update task progress manually (for flexibility)
     */
    updateProgress(id: number, companyId: number, progress: number): Promise<{
        project: {
            status: import(".prisma/client").$Enums.ProjectStatus;
            id: number;
            title: string;
        } | null;
        assignedEmployee: ({
            user: {
                id: string;
                email: string;
                profileImage: string | null;
            };
        } & {
            department: string | null;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            companyId: number;
            userId: string;
            departmentId: number | null;
            designation: string | null;
            salary: import("@prisma/client/runtime/library.js").Decimal | null;
            workHours: import("@prisma/client/runtime/library.js").Decimal | null;
            holidays: number | null;
            bonus: import("@prisma/client/runtime/library.js").Decimal | null;
            responsibilities: string | null;
            joinDate: Date | null;
        }) | null;
        group: {
            id: number;
            name: string;
            description: string;
        } | null;
    } & {
        status: import(".prisma/client").$Enums.TaskStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string;
        description: string | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        dueDate: Date | null;
        projectId: number | null;
        assignedTo: number | null;
        groupId: number | null;
        startedAt: Date | null;
        progress: import("@prisma/client/runtime/library.js").Decimal | null;
        conversationId: number | null;
    }>;
    /**
     * Add task comment
     */
    addTaskComment(data: CreateTaskCommentData): Promise<{
        user: {
            id: string;
            email: string;
            profileImage: string | null;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        content: string;
        taskId: number;
    }>;
    /**
     * Get task comments
     */
    getTaskComments(taskId: number): Promise<({
        user: {
            id: string;
            email: string;
            profileImage: string | null;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        content: string;
        taskId: number;
    })[]>;
    /**
     * Get tasks assigned to a specific user (for dashboard)
     * Includes tasks assigned directly to the user AND tasks assigned to groups the user belongs to
     */
    getUserTasks(userId: string, companyId: number): Promise<({
        project: {
            status: import(".prisma/client").$Enums.ProjectStatus;
            id: number;
            title: string;
        } | null;
        assignedEmployee: ({
            user: {
                id: string;
                email: string;
                profileImage: string | null;
            };
        } & {
            department: string | null;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            companyId: number;
            userId: string;
            departmentId: number | null;
            designation: string | null;
            salary: import("@prisma/client/runtime/library.js").Decimal | null;
            workHours: import("@prisma/client/runtime/library.js").Decimal | null;
            holidays: number | null;
            bonus: import("@prisma/client/runtime/library.js").Decimal | null;
            responsibilities: string | null;
            joinDate: Date | null;
        }) | null;
        group: {
            id: number;
            name: string;
            description: string;
        } | null;
    } & {
        status: import(".prisma/client").$Enums.TaskStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string;
        description: string | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        dueDate: Date | null;
        projectId: number | null;
        assignedTo: number | null;
        groupId: number | null;
        startedAt: Date | null;
        progress: import("@prisma/client/runtime/library.js").Decimal | null;
        conversationId: number | null;
    })[]>;
    /**
     * Assign task to user (SuperAdmin can assign to any employee)
     */
    assignTaskToUser(taskId: number, employeeId: number, companyId: number): Promise<{
        assignedEmployee: ({
            user: {
                role: {
                    id: number;
                    name: string;
                };
                id: string;
                email: string;
                profileImage: string | null;
            };
        } & {
            department: string | null;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            companyId: number;
            userId: string;
            departmentId: number | null;
            designation: string | null;
            salary: import("@prisma/client/runtime/library.js").Decimal | null;
            workHours: import("@prisma/client/runtime/library.js").Decimal | null;
            holidays: number | null;
            bonus: import("@prisma/client/runtime/library.js").Decimal | null;
            responsibilities: string | null;
            joinDate: Date | null;
        }) | null;
    } & {
        status: import(".prisma/client").$Enums.TaskStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string;
        description: string | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        dueDate: Date | null;
        projectId: number | null;
        assignedTo: number | null;
        groupId: number | null;
        startedAt: Date | null;
        progress: import("@prisma/client/runtime/library.js").Decimal | null;
        conversationId: number | null;
    }>;
};
export {};
//# sourceMappingURL=task.service.d.ts.map