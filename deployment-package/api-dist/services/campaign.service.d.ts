import { CampaignType, Prisma } from '@prisma/client';
interface CreateCampaignData {
    companyId: number;
    projectId: number;
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    budget: number;
    type: CampaignType;
    productIds?: number[];
    groupIds?: number[];
}
interface UpdateCampaignData {
    name?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    budget?: number;
    type?: CampaignType;
    productIds?: number[];
    projectId?: number;
    groupIds?: number[];
    isActive?: boolean;
}
export declare const campaignService: {
    /**
     * Get all campaigns for a company
     */
    getAllCampaigns(companyId: number, filters?: {
        type?: CampaignType;
        active?: boolean;
    }): Promise<{
        budget: Prisma.Decimal;
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
        type: import(".prisma/client").$Enums.CampaignType;
        description: string | null;
        projectId: number;
        startDate: Date;
        endDate: Date;
    }[]>;
    /**
     * Get campaign by ID
     */
    getCampaignById(id: number, companyId: number): Promise<{
        project: {
            client: {
                id: string;
                name: string | null;
                email: string;
            };
            id: number;
            title: string;
            clientId: string;
        };
        clients: ({
            client: {
                id: string;
                name: string | null;
                email: string;
            };
        } & {
            id: number;
            createdAt: Date;
            clientId: string;
            campaignId: number;
        })[];
        invoices: ({
            invoice: {
                status: import(".prisma/client").$Enums.InvoiceStatus;
                id: number;
                invoiceNumber: string;
                totalAmount: Prisma.Decimal;
            };
        } & {
            id: number;
            createdAt: Date;
            campaignId: number;
            invoiceId: number;
        })[];
        leads: ({
            assignedEmployee: ({
                user: {
                    id: string;
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
                salary: Prisma.Decimal | null;
                workHours: Prisma.Decimal | null;
                holidays: number | null;
                bonus: Prisma.Decimal | null;
                responsibilities: string | null;
                joinDate: Date | null;
            }) | null;
            createdByUser: {
                id: string;
                email: string;
            };
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
        })[];
        products: ({
            product: {
                category: {
                    id: number;
                    name: string;
                };
            } & {
                id: number;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                companyId: number;
                description: string | null;
                imageUrl: string | null;
                categoryId: number;
                purchasePrice: Prisma.Decimal;
                salePrice: Prisma.Decimal;
                currency: import(".prisma/client").$Enums.Currency;
                productCompany: string | null;
                quickReplies: Prisma.JsonValue | null;
            };
        } & {
            id: number;
            createdAt: Date;
            campaignId: number;
            productId: number;
        })[];
        groups: ({
            group: {
                id: number;
                name: string;
                description: string;
            };
        } & {
            id: number;
            createdAt: Date;
            groupId: number;
            campaignId: number;
        })[];
    } & {
        budget: Prisma.Decimal;
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
        type: import(".prisma/client").$Enums.CampaignType;
        description: string | null;
        projectId: number;
        startDate: Date;
        endDate: Date;
    }>;
    /**
     * Create campaign
     */
    createCampaign(data: CreateCampaignData): Promise<({
        project: {
            client: {
                id: string;
                name: string | null;
                email: string;
            };
            id: number;
            title: string;
            clientId: string;
        };
        clients: ({
            client: {
                id: string;
                name: string | null;
                email: string;
            };
        } & {
            id: number;
            createdAt: Date;
            clientId: string;
            campaignId: number;
        })[];
        invoices: ({
            invoice: {
                status: import(".prisma/client").$Enums.InvoiceStatus;
                id: number;
                invoiceNumber: string;
                totalAmount: Prisma.Decimal;
            };
        } & {
            id: number;
            createdAt: Date;
            campaignId: number;
            invoiceId: number;
        })[];
        leads: {
            id: number;
            value: Prisma.Decimal | null;
        }[];
        products: ({
            product: {
                category: {
                    id: number;
                    name: string;
                };
            } & {
                id: number;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                companyId: number;
                description: string | null;
                imageUrl: string | null;
                categoryId: number;
                purchasePrice: Prisma.Decimal;
                salePrice: Prisma.Decimal;
                currency: import(".prisma/client").$Enums.Currency;
                productCompany: string | null;
                quickReplies: Prisma.JsonValue | null;
            };
        } & {
            id: number;
            createdAt: Date;
            campaignId: number;
            productId: number;
        })[];
        groups: ({
            group: {
                id: number;
                name: string;
                description: string;
            };
        } & {
            id: number;
            createdAt: Date;
            groupId: number;
            campaignId: number;
        })[];
    } & {
        budget: Prisma.Decimal;
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
        type: import(".prisma/client").$Enums.CampaignType;
        description: string | null;
        projectId: number;
        startDate: Date;
        endDate: Date;
    }) | null>;
    /**
     * Update campaign
     */
    updateCampaign(id: number, companyId: number, data: UpdateCampaignData): Promise<({
        project: {
            client: {
                id: string;
                name: string | null;
                email: string;
            };
            id: number;
            title: string;
            clientId: string;
        };
        clients: ({
            client: {
                id: string;
                name: string | null;
                email: string;
            };
        } & {
            id: number;
            createdAt: Date;
            clientId: string;
            campaignId: number;
        })[];
        invoices: ({
            invoice: {
                status: import(".prisma/client").$Enums.InvoiceStatus;
                id: number;
                invoiceNumber: string;
                totalAmount: Prisma.Decimal;
            };
        } & {
            id: number;
            createdAt: Date;
            campaignId: number;
            invoiceId: number;
        })[];
        leads: {
            id: number;
            value: Prisma.Decimal | null;
        }[];
        products: ({
            product: {
                category: {
                    id: number;
                    name: string;
                };
            } & {
                id: number;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                companyId: number;
                description: string | null;
                imageUrl: string | null;
                categoryId: number;
                purchasePrice: Prisma.Decimal;
                salePrice: Prisma.Decimal;
                currency: import(".prisma/client").$Enums.Currency;
                productCompany: string | null;
                quickReplies: Prisma.JsonValue | null;
            };
        } & {
            id: number;
            createdAt: Date;
            campaignId: number;
            productId: number;
        })[];
        groups: ({
            group: {
                id: number;
                name: string;
                description: string;
            };
        } & {
            id: number;
            createdAt: Date;
            groupId: number;
            campaignId: number;
        })[];
    } & {
        budget: Prisma.Decimal;
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
        type: import(".prisma/client").$Enums.CampaignType;
        description: string | null;
        projectId: number;
        startDate: Date;
        endDate: Date;
    }) | null>;
    /**
     * Delete campaign
     */
    deleteCampaign(id: number, companyId: number): Promise<{
        budget: Prisma.Decimal;
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
        type: import(".prisma/client").$Enums.CampaignType;
        description: string | null;
        projectId: number;
        startDate: Date;
        endDate: Date;
    }>;
    /**
     * Get campaign statistics
     */
    getCampaignStatistics(id: number, companyId: number): Promise<{
        campaign: {
            id: number;
            name: string;
            budget: number;
        };
        statistics: {
            totalLeads: number;
            totalEstimatedValue: number;
            progressPercentage: number;
            budget: number;
            remainingBudget: number;
            leadsByStatus: Record<string, number>;
        };
    }>;
    /**
     * Get active campaigns (startDate <= now <= endDate)
     */
    getActiveCampaigns(companyId: number): Promise<({
        clients: ({
            client: {
                id: string;
                name: string | null;
                email: string;
            };
        } & {
            id: number;
            createdAt: Date;
            clientId: string;
            campaignId: number;
        })[];
        leads: {
            id: number;
            value: Prisma.Decimal | null;
        }[];
        products: ({
            product: {
                category: {
                    id: number;
                    name: string;
                };
            } & {
                id: number;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                companyId: number;
                description: string | null;
                imageUrl: string | null;
                categoryId: number;
                purchasePrice: Prisma.Decimal;
                salePrice: Prisma.Decimal;
                currency: import(".prisma/client").$Enums.Currency;
                productCompany: string | null;
                quickReplies: Prisma.JsonValue | null;
            };
        } & {
            id: number;
            createdAt: Date;
            campaignId: number;
            productId: number;
        })[];
        groups: ({
            group: {
                id: number;
                name: string;
                description: string;
            };
        } & {
            id: number;
            createdAt: Date;
            groupId: number;
            campaignId: number;
        })[];
    } & {
        budget: Prisma.Decimal;
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
        type: import(".prisma/client").$Enums.CampaignType;
        description: string | null;
        projectId: number;
        startDate: Date;
        endDate: Date;
    })[]>;
    /**
     * Get campaign clients
     */
    getCampaignClients(id: number, companyId: number): Promise<{
        id: string;
        createdAt: Date;
        email: string;
    }[]>;
    /**
     * Get campaign products
     */
    getCampaignProducts(campaignId: number, companyId: number): Promise<({
        category: {
            id: number;
            name: string;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string | null;
        imageUrl: string | null;
        categoryId: number;
        purchasePrice: Prisma.Decimal;
        salePrice: Prisma.Decimal;
        currency: import(".prisma/client").$Enums.Currency;
        productCompany: string | null;
        quickReplies: Prisma.JsonValue | null;
    })[]>;
    /**
     * Get campaign groups (employee groups assigned to campaign)
     */
    getCampaignGroups(campaignId: number, companyId: number): Promise<({
        members: ({
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
                salary: Prisma.Decimal | null;
                workHours: Prisma.Decimal | null;
                holidays: number | null;
                bonus: Prisma.Decimal | null;
                responsibilities: string | null;
                joinDate: Date | null;
            };
        } & {
            id: number;
            createdAt: Date;
            groupId: number;
            employeeId: number;
        })[];
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string;
        createdById: string;
    })[]>;
    /**
     * Get campaigns for a specific client
     */
    getClientCampaigns(clientId: string, companyId: number): Promise<({
        project: {
            status: import(".prisma/client").$Enums.ProjectStatus;
            id: number;
            title: string;
        };
        invoices: ({
            invoice: {
                status: import(".prisma/client").$Enums.InvoiceStatus;
                id: number;
                invoiceNumber: string;
                totalAmount: Prisma.Decimal;
            };
        } & {
            id: number;
            createdAt: Date;
            campaignId: number;
            invoiceId: number;
        })[];
        leads: {
            status: import(".prisma/client").$Enums.LeadStatus;
            id: number;
            value: Prisma.Decimal | null;
            title: string;
        }[];
        products: ({
            product: {
                category: {
                    id: number;
                    name: string;
                };
            } & {
                id: number;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                companyId: number;
                description: string | null;
                imageUrl: string | null;
                categoryId: number;
                purchasePrice: Prisma.Decimal;
                salePrice: Prisma.Decimal;
                currency: import(".prisma/client").$Enums.Currency;
                productCompany: string | null;
                quickReplies: Prisma.JsonValue | null;
            };
        } & {
            id: number;
            createdAt: Date;
            campaignId: number;
            productId: number;
        })[];
        groups: ({
            group: {
                id: number;
                name: string;
                description: string;
            };
        } & {
            id: number;
            createdAt: Date;
            groupId: number;
            campaignId: number;
        })[];
    } & {
        budget: Prisma.Decimal;
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
        type: import(".prisma/client").$Enums.CampaignType;
        description: string | null;
        projectId: number;
        startDate: Date;
        endDate: Date;
    })[]>;
};
export {};
//# sourceMappingURL=campaign.service.d.ts.map