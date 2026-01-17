import { InvoiceStatus } from '@prisma/client';
interface CreateInvoiceData {
    companyId: number;
    clientId: number;
    invoiceNumber: string;
    issueDate: Date;
    dueDate: Date;
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
    }>;
    notes?: string;
}
interface UpdateInvoiceData {
    clientId?: number;
    issueDate?: Date;
    dueDate?: Date;
    status?: InvoiceStatus;
    notes?: string;
    items?: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
    }>;
}
export declare const invoiceService: {
    /**
     * Generate unique invoice number
     */
    generateInvoiceNumber(companyId: number): Promise<string>;
    /**
     * Get all invoices for a company
     */
    getAllInvoices(companyId: number, filters?: {
        status?: InvoiceStatus;
        clientId?: number;
    }): Promise<({
        client: {
            id: number;
            name: string;
            contactInfo: import("@prisma/client/runtime/library.js").JsonValue;
        };
        _count: {
            items: number;
        };
        items: {
            id: number;
            createdAt: Date;
            description: string;
            total: import("@prisma/client/runtime/library.js").Decimal;
            quantity: import("@prisma/client/runtime/library.js").Decimal;
            unitPrice: import("@prisma/client/runtime/library.js").Decimal;
            invoiceId: number;
        }[];
    } & {
        status: import(".prisma/client").$Enums.InvoiceStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        dueDate: Date;
        projectId: number | null;
        clientId: number;
        notes: string | null;
        invoiceNumber: string;
        issueDate: Date;
        totalAmount: import("@prisma/client/runtime/library.js").Decimal;
    })[]>;
    /**
     * Get invoice by ID
     */
    getInvoiceById(id: number, companyId: number): Promise<{
        client: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            companyId: number;
            contactInfo: import("@prisma/client/runtime/library.js").JsonValue | null;
        };
        project: {
            status: import(".prisma/client").$Enums.ProjectStatus;
            service: {
                id: number;
                title: string;
                pricing: import("@prisma/client/runtime/library.js").Decimal;
            } | null;
            id: number;
            title: string;
            description: string | null;
        } | null;
        items: {
            id: number;
            createdAt: Date;
            description: string;
            total: import("@prisma/client/runtime/library.js").Decimal;
            quantity: import("@prisma/client/runtime/library.js").Decimal;
            unitPrice: import("@prisma/client/runtime/library.js").Decimal;
            invoiceId: number;
        }[];
    } & {
        status: import(".prisma/client").$Enums.InvoiceStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        dueDate: Date;
        projectId: number | null;
        clientId: number;
        notes: string | null;
        invoiceNumber: string;
        issueDate: Date;
        totalAmount: import("@prisma/client/runtime/library.js").Decimal;
    }>;
    /**
     * Get invoices for a client user (by email and userId)
     * Uses multiple methods to find invoices:
     * 1. Find invoices via Client records (matching email)
     * 2. Find invoices via Projects (matching userId)
     */
    getClientInvoices(userEmail: string, companyId: number, userId?: string): Promise<({
        client: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            companyId: number;
            contactInfo: import("@prisma/client/runtime/library.js").JsonValue | null;
        };
        project: {
            service: {
                id: number;
                title: string;
                pricing: import("@prisma/client/runtime/library.js").Decimal;
            } | null;
            id: number;
            title: string;
            description: string | null;
        } | null;
        items: {
            id: number;
            createdAt: Date;
            description: string;
            total: import("@prisma/client/runtime/library.js").Decimal;
            quantity: import("@prisma/client/runtime/library.js").Decimal;
            unitPrice: import("@prisma/client/runtime/library.js").Decimal;
            invoiceId: number;
        }[];
    } & {
        status: import(".prisma/client").$Enums.InvoiceStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        dueDate: Date;
        projectId: number | null;
        clientId: number;
        notes: string | null;
        invoiceNumber: string;
        issueDate: Date;
        totalAmount: import("@prisma/client/runtime/library.js").Decimal;
    })[]>;
    /**
     * Create invoice
     */
    createInvoice(data: CreateInvoiceData): Promise<{
        client: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            companyId: number;
            contactInfo: import("@prisma/client/runtime/library.js").JsonValue | null;
        };
        items: {
            id: number;
            createdAt: Date;
            description: string;
            total: import("@prisma/client/runtime/library.js").Decimal;
            quantity: import("@prisma/client/runtime/library.js").Decimal;
            unitPrice: import("@prisma/client/runtime/library.js").Decimal;
            invoiceId: number;
        }[];
    } & {
        status: import(".prisma/client").$Enums.InvoiceStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        dueDate: Date;
        projectId: number | null;
        clientId: number;
        notes: string | null;
        invoiceNumber: string;
        issueDate: Date;
        totalAmount: import("@prisma/client/runtime/library.js").Decimal;
    }>;
    /**
     * Update invoice
     */
    updateInvoice(id: number, companyId: number, data: UpdateInvoiceData): Promise<{
        client: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            companyId: number;
            contactInfo: import("@prisma/client/runtime/library.js").JsonValue | null;
        };
        items: {
            id: number;
            createdAt: Date;
            description: string;
            total: import("@prisma/client/runtime/library.js").Decimal;
            quantity: import("@prisma/client/runtime/library.js").Decimal;
            unitPrice: import("@prisma/client/runtime/library.js").Decimal;
            invoiceId: number;
        }[];
    } & {
        status: import(".prisma/client").$Enums.InvoiceStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        dueDate: Date;
        projectId: number | null;
        clientId: number;
        notes: string | null;
        invoiceNumber: string;
        issueDate: Date;
        totalAmount: import("@prisma/client/runtime/library.js").Decimal;
    }>;
    /**
     * Delete invoice
     */
    deleteInvoice(id: number, companyId: number): Promise<{
        status: import(".prisma/client").$Enums.InvoiceStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        dueDate: Date;
        projectId: number | null;
        clientId: number;
        notes: string | null;
        invoiceNumber: string;
        issueDate: Date;
        totalAmount: import("@prisma/client/runtime/library.js").Decimal;
    }>;
    /**
     * Generate invoice from project
     * Called when project status changes to "Submitted"
     */
    generateInvoiceFromProject(projectId: number): Promise<{
        status: import(".prisma/client").$Enums.InvoiceStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        dueDate: Date;
        projectId: number | null;
        clientId: number;
        notes: string | null;
        invoiceNumber: string;
        issueDate: Date;
        totalAmount: import("@prisma/client/runtime/library.js").Decimal;
    }>;
};
export {};
//# sourceMappingURL=invoice.service.d.ts.map