import { AttachmentFileType } from '@prisma/client';
interface CreateFileAttachmentData {
    taskId?: number;
    subTaskId?: number;
    companyId: number;
    fileType: AttachmentFileType;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    thumbnailUrl?: string;
    duration?: number;
    createdBy: string;
}
interface CreateLinkAttachmentData {
    taskId?: number;
    subTaskId?: number;
    companyId: number;
    linkUrl: string;
    linkTitle?: string;
    linkDescription?: string;
    thumbnailUrl?: string;
    createdBy: string;
}
interface LinkPreview {
    title?: string;
    description?: string;
    thumbnailUrl?: string;
}
export declare const taskAttachmentService: {
    /**
     * Create file attachment (image, PDF, video, audio)
     */
    createAttachment(data: CreateFileAttachmentData): Promise<{
        fileSize: number | bigint | null;
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
        mimeType: string | null;
        linkUrl: string | null;
        linkTitle: string | null;
        linkDescription: string | null;
        thumbnailUrl: string | null;
        duration: number | null;
    }>;
    /**
     * Create link attachment
     */
    createLinkAttachment(data: CreateLinkAttachmentData): Promise<{
        fileSize: number | bigint | null;
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
        mimeType: string | null;
        linkUrl: string | null;
        linkTitle: string | null;
        linkDescription: string | null;
        thumbnailUrl: string | null;
        duration: number | null;
    }>;
    /**
     * Delete attachment
     */
    deleteAttachment(id: number, companyId: number): Promise<{
        success: boolean;
    }>;
    /**
     * Get all attachments for a task
     */
    getAttachmentsByTaskId(taskId: number, companyId: number): Promise<{
        fileSize: number | bigint | null;
        creator: {
            id: string;
            name: string | null;
            email: string;
            profileImage: string | null;
        };
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
        mimeType: string | null;
        linkUrl: string | null;
        linkTitle: string | null;
        linkDescription: string | null;
        thumbnailUrl: string | null;
        duration: number | null;
    }[]>;
    /**
     * Get all attachments for a sub-task
     */
    getAttachmentsBySubTaskId(subTaskId: number, companyId: number): Promise<{
        fileSize: number | bigint | null;
        creator: {
            id: string;
            name: string | null;
            email: string;
            profileImage: string | null;
        };
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
        mimeType: string | null;
        linkUrl: string | null;
        linkTitle: string | null;
        linkDescription: string | null;
        thumbnailUrl: string | null;
        duration: number | null;
    }[]>;
    /**
     * Fetch link preview metadata (Open Graph tags, meta tags)
     */
    getLinkPreview(url: string): Promise<LinkPreview>;
};
export {};
//# sourceMappingURL=taskAttachment.service.d.ts.map