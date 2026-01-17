interface CreateIntegrationData {
    provider: 'facebook' | 'whatsapp' | 'chatwoot';
    pageId: string;
    accessToken: string;
    accountId?: string;
    baseUrl?: string;
    isActive?: boolean;
    webhookMode?: 'local' | 'live';
    isWebhookActive?: boolean;
    companyId?: number;
}
interface UpdateIntegrationData {
    pageId?: string;
    accessToken?: string;
    accountId?: string;
    baseUrl?: string;
    isActive?: boolean;
    webhookMode?: 'local' | 'live';
    isWebhookActive?: boolean;
}
export declare const integrationService: {
    /**
     * Create or update an integration
     */
    upsertIntegration(data: CreateIntegrationData): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
        provider: import(".prisma/client").$Enums.IntegrationProvider;
        pageId: string;
        accessToken: string;
        accountId: string | null;
        baseUrl: string | null;
        webhookMode: import(".prisma/client").$Enums.WebhookMode | null;
        isWebhookActive: boolean;
    }>;
    /**
     * Get all integrations
     */
    getIntegrations(): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
        provider: import(".prisma/client").$Enums.IntegrationProvider;
        pageId: string;
        accessToken: string;
        accountId: string | null;
        baseUrl: string | null;
        webhookMode: import(".prisma/client").$Enums.WebhookMode | null;
        isWebhookActive: boolean;
    }[]>;
    /**
     * Get integration by ID
     */
    getIntegrationById(id: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
        provider: import(".prisma/client").$Enums.IntegrationProvider;
        pageId: string;
        accessToken: string;
        accountId: string | null;
        baseUrl: string | null;
        webhookMode: import(".prisma/client").$Enums.WebhookMode | null;
        isWebhookActive: boolean;
    }>;
    /**
     * Get integration by provider and pageId
     */
    getIntegrationByProvider(provider: "facebook" | "whatsapp" | "chatwoot", pageId: string): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
        provider: import(".prisma/client").$Enums.IntegrationProvider;
        pageId: string;
        accessToken: string;
        accountId: string | null;
        baseUrl: string | null;
        webhookMode: import(".prisma/client").$Enums.WebhookMode | null;
        isWebhookActive: boolean;
    } | null>;
    /**
     * Update integration
     */
    updateIntegration(id: number, data: UpdateIntegrationData): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
        provider: import(".prisma/client").$Enums.IntegrationProvider;
        pageId: string;
        accessToken: string;
        accountId: string | null;
        baseUrl: string | null;
        webhookMode: import(".prisma/client").$Enums.WebhookMode | null;
        isWebhookActive: boolean;
    }>;
    /**
     * Delete integration
     */
    deleteIntegration(id: number): Promise<{
        success: boolean;
    }>;
};
export {};
//# sourceMappingURL=integration.service.d.ts.map