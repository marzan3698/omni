interface ChatwootConversation {
    id: number;
    inbox_id: number;
    status: string;
    last_activity_at: string;
    contact: {
        id: number;
        name: string;
        identifier: string;
    };
    messages?: ChatwootMessage[];
}
interface ChatwootMessage {
    id: number;
    content: string;
    message_type: number;
    created_at: number;
    sender?: {
        id: number;
        name: string;
        type: string;
    };
}
export declare const chatwootService: {
    /**
     * Fetch conversations from Chatwoot API
     */
    getChatwootConversations(accountId: string, inboxId: string, accessToken: string, baseUrl?: string | null): Promise<ChatwootConversation[]>;
    /**
     * Fetch messages for a specific conversation from Chatwoot API
     */
    getChatwootMessages(accountId: string, conversationId: number, accessToken: string, baseUrl?: string | null): Promise<ChatwootMessage[]>;
    /**
     * Send a message via Chatwoot API
     */
    sendChatwootMessage(accountId: string, conversationId: number, content: string, accessToken: string, baseUrl?: string | null, attachments?: Array<{
        type: string;
        data_url: string;
    }>): Promise<ChatwootMessage>;
    /**
     * Sync conversations from Chatwoot to local database
     */
    syncChatwootConversations(accountId: string, inboxId: string, accessToken: string, baseUrl?: string | null): Promise<{
        success: boolean;
        synced: number;
        created: number;
        updated: number;
    }>;
    /**
     * Process Chatwoot webhook event
     * Handles message_created events and automatically syncs to local database
     */
    processChatwootWebhook(payload: any): Promise<{
        success: boolean;
        message: string;
        conversationId?: undefined;
        messageSaved?: undefined;
    } | {
        success: boolean;
        message: string;
        conversationId: number;
        messageSaved: boolean;
    }>;
};
export {};
//# sourceMappingURL=chatwoot.service.d.ts.map