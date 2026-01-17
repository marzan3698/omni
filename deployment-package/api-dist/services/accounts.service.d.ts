interface CreateAccountPayableData {
    companyId: number;
    vendorName: string;
    amount: number;
    dueDate: Date;
    description?: string;
}
interface CreateAccountReceivableData {
    companyId: number;
    clientId?: number;
    invoiceId?: number;
    amount: number;
    dueDate: Date;
    description?: string;
}
interface UpdateAccountData {
    amount?: number;
    dueDate?: Date;
    status?: string;
    description?: string;
    paidDate?: Date;
}
export declare const accountsService: {
    /**
     * Get all accounts payable for a company
     */
    getAllPayables(companyId: number, filters?: {
        status?: string;
    }): Promise<{
        status: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string | null;
        dueDate: Date;
        amount: import("@prisma/client/runtime/library.js").Decimal;
        paidDate: Date | null;
        vendorName: string;
    }[]>;
    /**
     * Get all accounts receivable for a company
     */
    getAllReceivables(companyId: number, filters?: {
        status?: string;
        clientId?: number;
    }): Promise<({
        client: {
            id: number;
            name: string;
            contactInfo: import("@prisma/client/runtime/library.js").JsonValue;
        } | null;
        invoice: {
            id: number;
            invoiceNumber: string;
            totalAmount: import("@prisma/client/runtime/library.js").Decimal;
        } | null;
    } & {
        status: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string | null;
        dueDate: Date;
        clientId: number | null;
        amount: import("@prisma/client/runtime/library.js").Decimal;
        paidDate: Date | null;
        invoiceId: number | null;
    })[]>;
    /**
     * Get account payable by ID
     */
    getPayableById(id: number, companyId: number): Promise<{
        status: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string | null;
        dueDate: Date;
        amount: import("@prisma/client/runtime/library.js").Decimal;
        paidDate: Date | null;
        vendorName: string;
    }>;
    /**
     * Get account receivable by ID
     */
    getReceivableById(id: number, companyId: number): Promise<{
        client: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            companyId: number;
            contactInfo: import("@prisma/client/runtime/library.js").JsonValue | null;
        } | null;
        invoice: {
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
        } | null;
    } & {
        status: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string | null;
        dueDate: Date;
        clientId: number | null;
        amount: import("@prisma/client/runtime/library.js").Decimal;
        paidDate: Date | null;
        invoiceId: number | null;
    }>;
    /**
     * Create account payable
     */
    createPayable(data: CreateAccountPayableData): Promise<{
        status: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string | null;
        dueDate: Date;
        amount: import("@prisma/client/runtime/library.js").Decimal;
        paidDate: Date | null;
        vendorName: string;
    }>;
    /**
     * Create account receivable
     */
    createReceivable(data: CreateAccountReceivableData): Promise<{
        client: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            companyId: number;
            contactInfo: import("@prisma/client/runtime/library.js").JsonValue | null;
        } | null;
        invoice: {
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
        } | null;
    } & {
        status: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string | null;
        dueDate: Date;
        clientId: number | null;
        amount: import("@prisma/client/runtime/library.js").Decimal;
        paidDate: Date | null;
        invoiceId: number | null;
    }>;
    /**
     * Update account payable
     */
    updatePayable(id: number, companyId: number, data: UpdateAccountData): Promise<{
        status: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string | null;
        dueDate: Date;
        amount: import("@prisma/client/runtime/library.js").Decimal;
        paidDate: Date | null;
        vendorName: string;
    }>;
    /**
     * Update account receivable
     */
    updateReceivable(id: number, companyId: number, data: UpdateAccountData): Promise<{
        client: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            companyId: number;
            contactInfo: import("@prisma/client/runtime/library.js").JsonValue | null;
        } | null;
        invoice: {
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
        } | null;
    } & {
        status: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string | null;
        dueDate: Date;
        clientId: number | null;
        amount: import("@prisma/client/runtime/library.js").Decimal;
        paidDate: Date | null;
        invoiceId: number | null;
    }>;
    /**
     * Delete account payable
     */
    deletePayable(id: number, companyId: number): Promise<{
        status: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string | null;
        dueDate: Date;
        amount: import("@prisma/client/runtime/library.js").Decimal;
        paidDate: Date | null;
        vendorName: string;
    }>;
    /**
     * Delete account receivable
     */
    deleteReceivable(id: number, companyId: number): Promise<{
        status: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string | null;
        dueDate: Date;
        clientId: number | null;
        amount: import("@prisma/client/runtime/library.js").Decimal;
        paidDate: Date | null;
        invoiceId: number | null;
    }>;
};
export {};
//# sourceMappingURL=accounts.service.d.ts.map