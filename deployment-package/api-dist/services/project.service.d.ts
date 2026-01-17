import { ProjectStatus } from '@prisma/client';
interface CreateProjectData {
    companyId: number;
    clientId: string;
    serviceId: number;
    title?: string;
    description?: string;
    budget: number;
    deliveryStartDate?: Date;
    deliveryEndDate?: Date;
    time: string;
}
interface UpdateProjectData {
    title?: string;
    description?: string;
    budget?: number;
    time?: string;
    status?: ProjectStatus;
}
interface SignProjectData {
    signature: string;
}
export declare const projectService: {
    /**
     * Get all projects for a client
     */
    getClientProjects(clientId: string): Promise<({
        service: {
            id: number;
            title: string;
            pricing: import("@prisma/client/runtime/library.js").Decimal;
        } | null;
        invoices: {
            status: import(".prisma/client").$Enums.InvoiceStatus;
            id: number;
            dueDate: Date;
            invoiceNumber: string;
            totalAmount: import("@prisma/client/runtime/library.js").Decimal;
        }[];
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
     * Get all projects (for SuperAdmin or filtered by company)
     */
    getAllProjects(companyId?: number): Promise<({
        client: {
            id: string;
            name: string | null;
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
        invoices: {
            status: import(".prisma/client").$Enums.InvoiceStatus;
            id: number;
            dueDate: Date;
            invoiceNumber: string;
            totalAmount: import("@prisma/client/runtime/library.js").Decimal;
        }[];
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
     * Get project by ID
     */
    getProjectById(id: number, clientId: string): Promise<{
        service: {
            id: number;
            title: string;
            pricing: import("@prisma/client/runtime/library.js").Decimal;
            attributes: import("@prisma/client/runtime/library.js").JsonValue;
        } | null;
        invoices: {
            status: import(".prisma/client").$Enums.InvoiceStatus;
            id: number;
            dueDate: Date;
            invoiceNumber: string;
            totalAmount: import("@prisma/client/runtime/library.js").Decimal;
        }[];
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
     * Create a new project
     */
    createProject(data: CreateProjectData): Promise<{
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
    }>;
    /**
     * Update project
     */
    updateProject(id: number, clientId: string, data: UpdateProjectData): Promise<{
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
     * Sign project (submit e-signature)
     */
    signProject(id: number, clientId: string, data: SignProjectData): Promise<{
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
     * Update project status (admin only)
     */
    updateProjectStatus(id: number, status: ProjectStatus): Promise<{
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
     * Get project statistics for a client
     */
    getClientProjectStats(clientId: string): Promise<{
        total: number;
        active: number;
        completed: number;
    }>;
};
export {};
//# sourceMappingURL=project.service.d.ts.map