import { LeadSource, LeadStatus, Prisma } from '@prisma/client';
interface CreateLeadData {
    companyId: number;
    createdBy: string;
    title: string;
    description?: string;
    source: LeadSource;
    status?: LeadStatus;
    assignedTo?: number;
    value?: number;
    conversationId?: number;
    customerName?: string;
    phone?: string;
    categoryId?: number;
    interestId?: number;
    campaignId?: number;
    productId?: number;
    purchasePrice?: number;
    salePrice?: number;
    profit?: number;
}
interface UpdateLeadData {
    title?: string;
    description?: string;
    source?: LeadSource;
    status?: LeadStatus;
    assignedTo?: number;
    value?: number;
    customerName?: string;
    phone?: string;
    categoryId?: number;
    interestId?: number;
    campaignId?: number;
}
export declare const leadService: {
    /**
     * Get all leads (optionally filtered by user who created them)
     */
    getAllLeads(filters?: {
        createdBy?: string;
        status?: LeadStatus;
        source?: LeadSource;
        assignedTo?: number;
        categoryId?: number;
        interestId?: number;
        search?: string;
    }): Promise<({
        campaign: {
            id: number;
            name: string;
            type: import(".prisma/client").$Enums.CampaignType;
        } | null;
        product: {
            id: number;
            name: string;
            purchasePrice: Prisma.Decimal;
            salePrice: Prisma.Decimal;
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
            salary: Prisma.Decimal | null;
            workHours: Prisma.Decimal | null;
            holidays: number | null;
            bonus: Prisma.Decimal | null;
            responsibilities: string | null;
            joinDate: Date | null;
        }) | null;
        conversation: {
            id: number;
            platform: import(".prisma/client").$Enums.SocialPlatform;
            externalUserName: string | null;
            lastMessageAt: Date | null;
        } | null;
        category: {
            id: number;
            name: string;
        } | null;
        createdByUser: {
            id: string;
            email: string;
            profileImage: string | null;
        };
        interest: {
            id: number;
            name: string;
        } | null;
    } & {
        status: import(".prisma/client").$Enums.LeadStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        companyId: number;
        value: Prisma.Decimal | null;
        title: string;
        description: string | null;
        assignedTo: number | null;
        conversationId: number | null;
        createdBy: string;
        source: import(".prisma/client").$Enums.LeadSource;
        customerName: string | null;
        categoryId: number | null;
        interestId: number | null;
        campaignId: number | null;
        productId: number | null;
        purchasePrice: Prisma.Decimal | null;
        salePrice: Prisma.Decimal | null;
        profit: Prisma.Decimal | null;
    })[]>;
    /**
     * Get lead by ID
     */
    getLeadById(id: number, companyId: number): Promise<{
        campaign: {
            budget: Prisma.Decimal;
            id: number;
            name: string;
            type: import(".prisma/client").$Enums.CampaignType;
            description: string | null;
            startDate: Date;
            endDate: Date;
        } | null;
        product: {
            id: number;
            name: string;
            description: string | null;
            imageUrl: string | null;
            purchasePrice: Prisma.Decimal;
            salePrice: Prisma.Decimal;
            currency: import(".prisma/client").$Enums.Currency;
            productCompany: string | null;
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
            salary: Prisma.Decimal | null;
            workHours: Prisma.Decimal | null;
            holidays: number | null;
            bonus: Prisma.Decimal | null;
            responsibilities: string | null;
            joinDate: Date | null;
        }) | null;
        conversation: ({
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
        }) | null;
        category: {
            id: number;
            name: string;
        } | null;
        createdByUser: {
            role: {
                id: number;
                name: string;
            };
            id: string;
            name: string | null;
            email: string;
            phone: string | null;
            profileImage: string | null;
        };
        interest: {
            id: number;
            name: string;
        } | null;
    } & {
        status: import(".prisma/client").$Enums.LeadStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        companyId: number;
        value: Prisma.Decimal | null;
        title: string;
        description: string | null;
        assignedTo: number | null;
        conversationId: number | null;
        createdBy: string;
        source: import(".prisma/client").$Enums.LeadSource;
        customerName: string | null;
        categoryId: number | null;
        interestId: number | null;
        campaignId: number | null;
        productId: number | null;
        purchasePrice: Prisma.Decimal | null;
        salePrice: Prisma.Decimal | null;
        profit: Prisma.Decimal | null;
    }>;
    /**
     * Create lead from inbox conversation
     */
    createLeadFromInbox(conversationId: number, userId: string, data: {
        title: string;
        description?: string;
        assignedTo?: number;
        value?: number;
        customerName?: string;
        phone?: string;
        categoryId: number;
        interestId: number;
        campaignId: number;
        productId?: number;
        purchasePrice?: number;
        salePrice?: number;
        profit?: number;
    }): Promise<{
        campaign: {
            id: number;
            name: string;
            type: import(".prisma/client").$Enums.CampaignType;
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
            salary: Prisma.Decimal | null;
            workHours: Prisma.Decimal | null;
            holidays: number | null;
            bonus: Prisma.Decimal | null;
            responsibilities: string | null;
            joinDate: Date | null;
        }) | null;
        conversation: {
            id: number;
            platform: import(".prisma/client").$Enums.SocialPlatform;
            externalUserName: string | null;
        } | null;
        category: {
            id: number;
            name: string;
        } | null;
        createdByUser: {
            id: string;
            email: string;
            profileImage: string | null;
        };
        interest: {
            id: number;
            name: string;
        } | null;
    } & {
        status: import(".prisma/client").$Enums.LeadStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        companyId: number;
        value: Prisma.Decimal | null;
        title: string;
        description: string | null;
        assignedTo: number | null;
        conversationId: number | null;
        createdBy: string;
        source: import(".prisma/client").$Enums.LeadSource;
        customerName: string | null;
        categoryId: number | null;
        interestId: number | null;
        campaignId: number | null;
        productId: number | null;
        purchasePrice: Prisma.Decimal | null;
        salePrice: Prisma.Decimal | null;
        profit: Prisma.Decimal | null;
    }>;
    /**
     * Create lead
     */
    createLead(data: CreateLeadData): Promise<{
        status: import(".prisma/client").$Enums.LeadStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        companyId: number;
        value: Prisma.Decimal | null;
        title: string;
        description: string | null;
        assignedTo: number | null;
        conversationId: number | null;
        createdBy: string;
        source: import(".prisma/client").$Enums.LeadSource;
        customerName: string | null;
        categoryId: number | null;
        interestId: number | null;
        campaignId: number | null;
        productId: number | null;
        purchasePrice: Prisma.Decimal | null;
        salePrice: Prisma.Decimal | null;
        profit: Prisma.Decimal | null;
    }>;
    /**
     * Update lead
     */
    updateLead(id: number, companyId: number, data: UpdateLeadData): Promise<{
        campaign: {
            id: number;
            name: string;
            type: import(".prisma/client").$Enums.CampaignType;
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
            salary: Prisma.Decimal | null;
            workHours: Prisma.Decimal | null;
            holidays: number | null;
            bonus: Prisma.Decimal | null;
            responsibilities: string | null;
            joinDate: Date | null;
        }) | null;
        conversation: {
            id: number;
            platform: import(".prisma/client").$Enums.SocialPlatform;
            externalUserName: string | null;
        } | null;
        category: {
            id: number;
            name: string;
        } | null;
        interest: {
            id: number;
            name: string;
        } | null;
    } & {
        status: import(".prisma/client").$Enums.LeadStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        companyId: number;
        value: Prisma.Decimal | null;
        title: string;
        description: string | null;
        assignedTo: number | null;
        conversationId: number | null;
        createdBy: string;
        source: import(".prisma/client").$Enums.LeadSource;
        customerName: string | null;
        categoryId: number | null;
        interestId: number | null;
        campaignId: number | null;
        productId: number | null;
        purchasePrice: Prisma.Decimal | null;
        salePrice: Prisma.Decimal | null;
        profit: Prisma.Decimal | null;
    }>;
    /**
     * Update lead status
     */
    updateLeadStatus(id: number, companyId: number, status: LeadStatus): Promise<{
        campaign: {
            id: number;
            name: string;
            type: import(".prisma/client").$Enums.CampaignType;
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
            salary: Prisma.Decimal | null;
            workHours: Prisma.Decimal | null;
            holidays: number | null;
            bonus: Prisma.Decimal | null;
            responsibilities: string | null;
            joinDate: Date | null;
        }) | null;
        conversation: {
            id: number;
            platform: import(".prisma/client").$Enums.SocialPlatform;
            externalUserName: string | null;
        } | null;
        category: {
            id: number;
            name: string;
        } | null;
        interest: {
            id: number;
            name: string;
        } | null;
    } & {
        status: import(".prisma/client").$Enums.LeadStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        companyId: number;
        value: Prisma.Decimal | null;
        title: string;
        description: string | null;
        assignedTo: number | null;
        conversationId: number | null;
        createdBy: string;
        source: import(".prisma/client").$Enums.LeadSource;
        customerName: string | null;
        categoryId: number | null;
        interestId: number | null;
        campaignId: number | null;
        productId: number | null;
        purchasePrice: Prisma.Decimal | null;
        salePrice: Prisma.Decimal | null;
        profit: Prisma.Decimal | null;
    }>;
    /**
     * Delete lead
     */
    deleteLead(id: number, companyId: number): Promise<{
        status: import(".prisma/client").$Enums.LeadStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        companyId: number;
        value: Prisma.Decimal | null;
        title: string;
        description: string | null;
        assignedTo: number | null;
        conversationId: number | null;
        createdBy: string;
        source: import(".prisma/client").$Enums.LeadSource;
        customerName: string | null;
        categoryId: number | null;
        interestId: number | null;
        campaignId: number | null;
        productId: number | null;
        purchasePrice: Prisma.Decimal | null;
        salePrice: Prisma.Decimal | null;
        profit: Prisma.Decimal | null;
    }>;
    /**
     * Convert lead to client
     */
    convertLeadToClient(id: number, companyId: number, clientData?: {
        name?: string;
        contactInfo?: any;
        address?: string;
    }): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        companyId: number;
        contactInfo: Prisma.JsonValue | null;
    }>;
    /**
     * Get lead pipeline statistics
     */
    getLeadPipeline(companyId: number): Promise<{
        status: import(".prisma/client").$Enums.LeadStatus;
        count: number;
        totalValue: number;
    }[]>;
    /**
     * Get leads for a client from campaigns they're assigned to
     * Only accessible if client has at least one completed project
     */
    getClientLeads(clientId: string, filters?: {
        campaignId?: number;
    }): Promise<({
        campaign: {
            id: number;
            name: string;
        } | null;
        category: {
            id: number;
            name: string;
        } | null;
        interest: {
            id: number;
            name: string;
        } | null;
    } & {
        status: import(".prisma/client").$Enums.LeadStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        companyId: number;
        value: Prisma.Decimal | null;
        title: string;
        description: string | null;
        assignedTo: number | null;
        conversationId: number | null;
        createdBy: string;
        source: import(".prisma/client").$Enums.LeadSource;
        customerName: string | null;
        categoryId: number | null;
        interestId: number | null;
        campaignId: number | null;
        productId: number | null;
        purchasePrice: Prisma.Decimal | null;
        salePrice: Prisma.Decimal | null;
        profit: Prisma.Decimal | null;
    })[]>;
};
export {};
//# sourceMappingURL=lead.service.d.ts.map