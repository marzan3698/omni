interface FacebookWebhookEntry {
    id: string;
    time: number;
    messaging?: Array<{
        sender: {
            id: string;
        };
        recipient: {
            id: string;
        };
        timestamp: number;
        message?: {
            mid: string;
            text?: string;
            attachments?: Array<{
                type: string;
                payload?: {
                    url?: string;
                };
            }>;
            sticker_id?: number;
            quick_reply?: {
                payload: string;
            };
        };
        postback?: any;
        delivery?: any;
        read?: any;
    }>;
}
interface FacebookWebhookPayload {
    object?: string;
    entry?: FacebookWebhookEntry[];
    field?: string;
    value?: {
        sender: {
            id: string;
        };
        recipient: {
            id: string;
        };
        timestamp: string | number;
        message?: {
            mid: string;
            text: string;
            commands?: Array<{
                name: string;
            }>;
        };
    };
}
export declare const socialService: {
    /**
     * Verify Facebook webhook
     * Facebook sends a GET request with hub.mode, hub.verify_token, and hub.challenge
     */
    verifyWebhook(verifyToken: string, challenge: string, mode: string): string;
    /**
     * Process incoming Facebook messages
     * Handles both production format (object: 'page') and test format (field: 'messages')
     */
    processFacebookMessage(payload: FacebookWebhookPayload): Promise<{
        success: boolean;
    }>;
    /**
     * Get all conversations
     */
    getConversations(status?: "Open" | "Closed", companyId?: number, tab?: "inbox" | "taken" | "complete", assignedToEmployeeId?: number): Promise<{
        unreadCount: number;
        _count: {
            releases: number;
            messages: number;
        };
        assignedEmployee: ({
            user: {
                id: string;
                name: string | null;
                email: string;
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
        messages: {
            id: number;
            createdAt: Date;
            conversationId: number;
            content: string;
            senderType: import(".prisma/client").$Enums.SenderType;
            imageUrl: string | null;
            isRead: boolean;
            readAt: Date | null;
            isSeen: boolean;
            seenAt: Date | null;
        }[];
        status: import(".prisma/client").$Enums.ConversationStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        assignedTo: number | null;
        platform: import(".prisma/client").$Enums.SocialPlatform;
        externalUserId: string;
        externalUserName: string | null;
        lastMessageAt: Date | null;
        assignedAt: Date | null;
    }[]>;
    /**
     * Get conversation analytics (counts + daily trend)
     */
    getConversationAnalytics(companyId?: number, days?: number): Promise<{
        totalConversations: number;
        openConversations: number;
        closedConversations: number;
        platformBreakdown: {
            facebook: number;
            chatwoot: number;
            other: number;
        };
        daily: {
            date: string;
            messages: number;
            conversations: number;
        }[];
    }>;
    /**
     * Get messages for a specific conversation
     */
    getConversationMessages(conversationId: number, companyId?: number): Promise<{
        messages: {
            id: number;
            createdAt: Date;
            conversationId: number;
            content: string;
            senderType: import(".prisma/client").$Enums.SenderType;
            imageUrl: string | null;
            isRead: boolean;
            readAt: Date | null;
            isSeen: boolean;
            seenAt: Date | null;
        }[];
    } & {
        status: import(".prisma/client").$Enums.ConversationStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        assignedTo: number | null;
        platform: import(".prisma/client").$Enums.SocialPlatform;
        externalUserId: string;
        externalUserName: string | null;
        lastMessageAt: Date | null;
        assignedAt: Date | null;
    }>;
    /**
     * Send a reply message (agent response)
     */
    sendReply(conversationId: number, content: string, agentId: string, imageUrl?: string | null): Promise<{
        id: number;
        createdAt: Date;
        conversationId: number;
        content: string;
        senderType: import(".prisma/client").$Enums.SenderType;
        imageUrl: string | null;
        isRead: boolean;
        readAt: Date | null;
        isSeen: boolean;
        seenAt: Date | null;
    }>;
    /**
     * Sync Chatwoot conversations
     */
    syncChatwootConversations(): Promise<{
        success: boolean;
        message: string;
        synced: number;
        results?: undefined;
        totalSynced?: undefined;
        totalCreated?: undefined;
        totalUpdated?: undefined;
    } | {
        success: boolean;
        message: string;
        results: ({
            success: boolean;
            synced: number;
            created: number;
            updated: number;
            integrationId: number;
            error?: undefined;
        } | {
            integrationId: number;
            success: boolean;
            error: any;
        })[];
        totalSynced: number;
        totalCreated: number;
        totalUpdated: number;
        synced?: undefined;
    }>;
    /**
     * Mark all unread messages in a conversation as read
     */
    markMessagesAsRead(conversationId: number, userId: string, companyId: number): Promise<{
        success: boolean;
        markedCount: number;
    }>;
    /**
     * Mark a single message as read
     */
    markMessageAsRead(messageId: number, userId: string, companyId: number): Promise<{
        id: number;
        createdAt: Date;
        conversationId: number;
        content: string;
        senderType: import(".prisma/client").$Enums.SenderType;
        imageUrl: string | null;
        isRead: boolean;
        readAt: Date | null;
        isSeen: boolean;
        seenAt: Date | null;
    }>;
    /**
     * Update seen status for messages (from Facebook read receipts)
     */
    updateSeenStatus(conversationId: number, messageIds: number[], companyId: number): Promise<{
        success: boolean;
        markedCount: number;
    }>;
    /**
     * Update typing indicator status
     */
    updateTypingStatus(conversationId: number, userId: string, isTyping: boolean): {
        success: boolean;
        isTyping: boolean;
    };
    /**
     * Get typing indicator status for a conversation
     */
    getTypingStatus(conversationId: number): {
        isTyping: boolean;
        userId?: string;
    } | null;
    /**
     * Assign a conversation to an employee
     */
    assignConversation(conversationId: number, employeeId: number, companyId: number): Promise<{
        assignedEmployee: ({
            user: {
                id: string;
                name: string | null;
                email: string;
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
        status: import(".prisma/client").$Enums.ConversationStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        assignedTo: number | null;
        platform: import(".prisma/client").$Enums.SocialPlatform;
        externalUserId: string;
        externalUserName: string | null;
        lastMessageAt: Date | null;
        assignedAt: Date | null;
    }>;
    /**
     * Unassign a conversation (remove assignment)
     */
    unassignConversation(conversationId: number, companyId: number, employeeId: number): Promise<{
        status: import(".prisma/client").$Enums.ConversationStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        assignedTo: number | null;
        platform: import(".prisma/client").$Enums.SocialPlatform;
        externalUserId: string;
        externalUserName: string | null;
        lastMessageAt: Date | null;
        assignedAt: Date | null;
    }>;
    /**
     * Mark conversation as complete (status: 'Closed')
     */
    completeConversation(conversationId: number, companyId: number): Promise<{
        _count: {
            releases: number;
            messages: number;
        };
        assignedEmployee: ({
            user: {
                id: string;
                name: string | null;
                email: string;
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
        messages: {
            id: number;
            createdAt: Date;
            conversationId: number;
            content: string;
            senderType: import(".prisma/client").$Enums.SenderType;
            imageUrl: string | null;
            isRead: boolean;
            readAt: Date | null;
            isSeen: boolean;
            seenAt: Date | null;
        }[];
    } & {
        status: import(".prisma/client").$Enums.ConversationStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        assignedTo: number | null;
        platform: import(".prisma/client").$Enums.SocialPlatform;
        externalUserId: string;
        externalUserName: string | null;
        lastMessageAt: Date | null;
        assignedAt: Date | null;
    }>;
    /**
     * Get conversation statistics (for dashboard)
     */
    getConversationStats(companyId: number): Promise<{
        totalAssigned: number;
        activeEmployees: {
            id: number;
            name: string;
            email: string;
            assignedCount: number;
        }[];
        totalReleases: number;
        releasesByEmployee: {
            employeeId: number;
            employeeName: string;
            releaseCount: number;
        }[];
    }>;
    /**
     * Get release history for a conversation
     */
    getConversationReleaseHistory(conversationId: number, companyId: number): Promise<({
        employee: {
            user: {
                id: string;
                name: string | null;
                email: string;
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
        };
    } & {
        id: number;
        createdAt: Date;
        companyId: number;
        conversationId: number;
        employeeId: number;
        releasedAt: Date;
    })[]>;
};
export {};
//# sourceMappingURL=social.service.d.ts.map