import { TaskStatus } from '@prisma/client';
interface CreateSubTaskData {
    taskId: number;
    companyId: number;
    title: string;
    instructions?: string;
    weight?: number;
    order?: number;
}
interface UpdateSubTaskData {
    title?: string;
    instructions?: string;
    weight?: number;
    order?: number;
    status?: TaskStatus;
}
export declare const subTaskService: {
    /**
     * Create sub-task
     */
    createSubTask(data: CreateSubTaskData): Promise<{
        attachments: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            companyId: number;
            createdBy: string;
            taskId: number | null;
            subTaskId: number | null;
            fileType: import(".prisma/client").$Enums.AttachmentFileType;
            fileUrl: string | null;
            fileName: string | null;
            fileSize: bigint | null;
            mimeType: string | null;
            linkUrl: string | null;
            linkTitle: string | null;
            linkDescription: string | null;
            thumbnailUrl: string | null;
            duration: number | null;
        }[];
    } & {
        status: import(".prisma/client").$Enums.TaskStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string;
        startedAt: Date | null;
        taskId: number;
        instructions: string | null;
        weight: import("@prisma/client/runtime/library.js").Decimal;
        order: number;
        completedAt: Date | null;
    }>;
    /**
     * Update sub-task
     */
    updateSubTask(id: number, companyId: number, data: UpdateSubTaskData): Promise<{
        attachments: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            companyId: number;
            createdBy: string;
            taskId: number | null;
            subTaskId: number | null;
            fileType: import(".prisma/client").$Enums.AttachmentFileType;
            fileUrl: string | null;
            fileName: string | null;
            fileSize: bigint | null;
            mimeType: string | null;
            linkUrl: string | null;
            linkTitle: string | null;
            linkDescription: string | null;
            thumbnailUrl: string | null;
            duration: number | null;
        }[];
    } & {
        status: import(".prisma/client").$Enums.TaskStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string;
        startedAt: Date | null;
        taskId: number;
        instructions: string | null;
        weight: import("@prisma/client/runtime/library.js").Decimal;
        order: number;
        completedAt: Date | null;
    }>;
    /**
     * Delete sub-task
     */
    deleteSubTask(id: number, companyId: number): Promise<{
        success: boolean;
    }>;
    /**
     * Get all sub-tasks for a task
     */
    getSubTasksByTaskId(taskId: number, companyId: number): Promise<({
        attachments: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            companyId: number;
            createdBy: string;
            taskId: number | null;
            subTaskId: number | null;
            fileType: import(".prisma/client").$Enums.AttachmentFileType;
            fileUrl: string | null;
            fileName: string | null;
            fileSize: bigint | null;
            mimeType: string | null;
            linkUrl: string | null;
            linkTitle: string | null;
            linkDescription: string | null;
            thumbnailUrl: string | null;
            duration: number | null;
        }[];
    } & {
        status: import(".prisma/client").$Enums.TaskStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string;
        startedAt: Date | null;
        taskId: number;
        instructions: string | null;
        weight: import("@prisma/client/runtime/library.js").Decimal;
        order: number;
        completedAt: Date | null;
    })[]>;
    /**
     * Calculate weighted progress for a task based on sub-tasks
     * Formula: Sum of (sub-task weight * completion percentage) / Total weight
     */
    calculateTaskProgress(taskId: number, companyId: number): Promise<number>;
};
export {};
//# sourceMappingURL=subTask.service.d.ts.map