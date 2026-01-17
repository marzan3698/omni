import { ProjectStatus } from '@prisma/client';
interface UpdateProjectData {
    title?: string;
    description?: string;
    budget?: number;
    deliveryStartDate?: Date;
    deliveryEndDate?: Date;
    time?: string;
    status?: ProjectStatus;
}
interface UpdateClientData {
    name?: string;
    contactInfo?: any;
    address?: string;
}
export declare const adminService: {
    /**
     * Get all projects across all companies (SuperAdmin only)
     */
    getAllProjects(filters?: {
        companyId?: number;
        status?: ProjectStatus;
        search?: string;
    }): Promise<({
        client: {
            id: string;
            email: string;
        };
        company: {
            id: number;
            name: string;
        };
        service: {
            id: number;
            title: string;
            pricing: import("@prisma/client/runtime/library.js").Decimal;
        } | null;
    } & {
        status: import(".prisma/client").$Enums.ProjectStatus;
        budget: import("@prisma/client/runtime/library.js").Decimal;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string;
        description: string | null;
        clientId: string;
        documentUrl: string | null;
        serviceId: number | null;
        deliveryStartDate: Date | null;
        deliveryEndDate: Date | null;
        time: string;
        signature: string | null;
        signedAt: Date | null;
    })[]>;
    /**
     * Get all clients across all companies (SuperAdmin only)
     */
    getAllClients(filters?: {
        companyId?: number;
        search?: string;
    }): Promise<({
        company: {
            id: number;
            name: string;
        };
        _count: {
            invoices: number;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        companyId: number;
        contactInfo: import("@prisma/client/runtime/library.js").JsonValue | null;
    })[]>;
    /**
     * Update project (SuperAdmin/Admin)
     */
    updateProject(id: number, data: UpdateProjectData): Promise<{
        client: {
            id: string;
            email: string;
        };
        company: {
            id: number;
            name: string;
        };
        service: {
            id: number;
            title: string;
        } | null;
    } & {
        status: import(".prisma/client").$Enums.ProjectStatus;
        budget: import("@prisma/client/runtime/library.js").Decimal;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string;
        description: string | null;
        clientId: string;
        documentUrl: string | null;
        serviceId: number | null;
        deliveryStartDate: Date | null;
        deliveryEndDate: Date | null;
        time: string;
        signature: string | null;
        signedAt: Date | null;
    }>;
    /**
     * Delete project (SuperAdmin/Admin)
     */
    deleteProject(id: number): Promise<{
        status: import(".prisma/client").$Enums.ProjectStatus;
        budget: import("@prisma/client/runtime/library.js").Decimal;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string;
        description: string | null;
        clientId: string;
        documentUrl: string | null;
        serviceId: number | null;
        deliveryStartDate: Date | null;
        deliveryEndDate: Date | null;
        time: string;
        signature: string | null;
        signedAt: Date | null;
    }>;
    /**
     * Update client (SuperAdmin/Admin)
     */
    updateClient(id: number, data: UpdateClientData): Promise<{
        company: {
            id: number;
            name: string;
        };
        _count: {
            invoices: number;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        companyId: number;
        contactInfo: import("@prisma/client/runtime/library.js").JsonValue | null;
    }>;
    /**
     * Delete client (SuperAdmin/Admin)
     */
    deleteClient(id: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        companyId: number;
        contactInfo: import("@prisma/client/runtime/library.js").JsonValue | null;
    }>;
    /**
     * Get client by ID with all related data (SuperAdmin only)
     */
    getClientById(id: number): Promise<{
        id: number;
        name: string;
        contactInfo: import("@prisma/client/runtime/library.js").JsonValue;
        address: string | null;
        company: {
            id: number;
            name: string;
            email: string | null;
            phone: string | null;
            address: string | null;
        };
        createdAt: Date;
        updatedAt: Date;
        invoices: {
            id: number;
            invoiceNumber: string;
            issueDate: Date;
            dueDate: Date;
            totalAmount: import("@prisma/client/runtime/library.js").Decimal;
            status: import(".prisma/client").$Enums.InvoiceStatus;
            notes: string | null;
        }[];
        campaigns: any[];
        employeeGroups: any[];
        employees: any[];
        stats: {
            totalInvoices: number;
            totalCampaigns: number;
            totalLeads: any;
            totalEmployees: number;
        };
    }>;
    /**
     * Get project by ID with all related data (SuperAdmin only)
     */
    getProjectById(id: number): Promise<{
        id: number;
        title: string;
        description: string | null;
        budget: import("@prisma/client/runtime/library.js").Decimal;
        time: string;
        status: import(".prisma/client").$Enums.ProjectStatus;
        deliveryStartDate: Date | null;
        deliveryEndDate: Date | null;
        signature: string | null;
        signedAt: Date | null;
        documentUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        company: {
            id: number;
            name: string;
            email: string | null;
            phone: string | null;
            address: string | null;
        };
        client: {
            id: string;
            name: string | null;
            email: string;
            phone: string | null;
            profileImage: string | null;
        };
        service: {
            id: number;
            title: string;
            deliveryStartDate: Date;
            deliveryEndDate: Date;
            details: string;
            pricing: import("@prisma/client/runtime/library.js").Decimal;
        } | null;
        invoices: {
            id: number;
            invoiceNumber: string;
            issueDate: Date;
            dueDate: Date;
            totalAmount: import("@prisma/client/runtime/library.js").Decimal;
            status: import(".prisma/client").$Enums.InvoiceStatus;
            notes: string | null;
            items: {
                id: number;
                createdAt: Date;
                description: string;
                total: import("@prisma/client/runtime/library.js").Decimal;
                quantity: import("@prisma/client/runtime/library.js").Decimal;
                unitPrice: import("@prisma/client/runtime/library.js").Decimal;
                invoiceId: number;
            }[];
        }[];
        payments: {
            id: number;
            amount: import("@prisma/client/runtime/library.js").Decimal;
            transactionId: string | null;
            paymentMethod: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            paidBy: string | null;
            paidAt: Date | null;
            verifiedAt: Date | null;
            notes: string | null;
            adminNotes: string | null;
            paymentGateway: {
                id: number;
                name: string;
                accountType: string;
            };
        }[];
        campaigns: {
            id: number;
            name: string;
            description: string | null;
            startDate: Date;
            endDate: Date;
            budget: import("@prisma/client/runtime/library.js").Decimal;
            type: import(".prisma/client").$Enums.CampaignType;
            isActive: boolean;
            leads: ({
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
                category: {
                    id: number;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    isActive: boolean;
                    companyId: number;
                } | null;
                interest: {
                    id: number;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    isActive: boolean;
                    companyId: number;
                } | null;
            } & {
                status: import(".prisma/client").$Enums.LeadStatus;
                id: number;
                createdAt: Date;
                updatedAt: Date;
                phone: string | null;
                companyId: number;
                value: import("@prisma/client/runtime/library.js").Decimal | null;
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
                purchasePrice: import("@prisma/client/runtime/library.js").Decimal | null;
                salePrice: import("@prisma/client/runtime/library.js").Decimal | null;
                profit: import("@prisma/client/runtime/library.js").Decimal | null;
            })[];
            employeeGroups: {
                id: number;
                name: string;
                description: string;
                members: {
                    id: number;
                    userId: string;
                    designation: string | null;
                    department: string | null;
                    user: {
                        id: string;
                        name: string | null;
                        email: string;
                        phone: string | null;
                    };
                }[];
            }[];
            products: {
                id: number;
                name: string;
                salePrice: import("@prisma/client/runtime/library.js").Decimal;
                currency: import(".prisma/client").$Enums.Currency;
            }[];
        }[];
        stats: {
            totalInvoices: number;
            totalPayments: number;
            totalCampaigns: number;
            totalLeads: number;
            totalEmployees: number;
        };
    }>;
};
export {};
//# sourceMappingURL=admin.service.d.ts.map