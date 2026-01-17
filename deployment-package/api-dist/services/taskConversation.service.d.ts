import { TaskMessageType } from '@prisma/client';
interface CreateConversationData {
    taskId: number;
    companyId: number;
}
interface SendMessageData {
    conversationId: number;
    senderId: string;
    content?: string;
    messageType?: TaskMessageType;
    attachmentId?: number;
}
export declare const taskConversationService: {
    /**
     * Create conversation for a task
     */
    createConversation(data: CreateConversationData): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        taskId: number;
    }>;
    /**
     * Send message in task conversation
     */
    sendMessage(data: SendMessageData): Promise<{
        sender: {
            id: string;
            name: string | null;
            email: string;
            profileImage: string | null;
        };
        attachment: ({
            creator: {
                id: string;
                email: string;
                profileImage: string | null;
            };
        } & {
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
        }) | null;
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        conversationId: number;
        content: string | null;
        isRead: boolean;
        readAt: Date | null;
        messageType: import(".prisma/client").$Enums.TaskMessageType;
        senderId: string;
        attachmentId: number | null;
    }>;
    /**
     * Get messages for a conversation with pagination
     */
    getMessages(conversationId: number, companyId: number, page?: number, limit?: number): Promise<{
        messages: (({
            sender: {
                id: string;
                name: string | null;
                email: string;
                profileImage: string | null;
            };
            attachment: ({
                creator: {
                    id: string;
                    email: string;
                    profileImage: string | null;
                };
            } & {
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
            }) | null;
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            conversationId: number;
            content: string | null;
            isRead: boolean;
            readAt: Date | null;
            messageType: import(".prisma/client").$Enums.TaskMessageType;
            senderId: string;
            attachmentId: number | null;
        }) | {
            attachment: {
                fileSize: number;
                creator: {
                    id: string;
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
            };
            sender: {
                id: string;
                name: string | null;
                email: string;
                profileImage: string | null;
            };
            id: number;
            createdAt: Date;
            updatedAt: Date;
            conversationId: number;
            content: string | null;
            isRead: boolean;
            readAt: Date | null;
            messageType: import(".prisma/client").$Enums.TaskMessageType;
            senderId: string;
            attachmentId: number | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * Mark message as read
     */
    markAsRead(messageId: number, userId: string, companyId: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        conversationId: number;
        content: string | null;
        isRead: boolean;
        readAt: Date | null;
        messageType: import(".prisma/client").$Enums.TaskMessageType;
        senderId: string;
        attachmentId: number | null;
    }>;
    /**
     * Mark all messages in conversation as read for a user
     */
    markAllAsRead(conversationId: number, userId: string, companyId: number): Promise<{
        success: boolean;
        count: number;
    }>;
    /**
     * Get unread message count for a user in a conversation
     */
    getUnreadCount(conversationId: number, userId: string, companyId: number): Promise<number>;
    /**
     * Get conversation by task ID
     */
    getConversationByTaskId(taskId: number, companyId: number): Promise<({
        task: {
            status: import(".prisma/client").$Enums.TaskStatus;
            id: number;
            title: string;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        taskId: number;
    }) | null>;
};
export {};
//# sourceMappingURL=taskConversation.service.d.ts.map