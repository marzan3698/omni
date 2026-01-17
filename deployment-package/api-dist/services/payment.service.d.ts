import { Prisma } from '@prisma/client';
interface CreatePaymentData {
    companyId: number;
    invoiceId: number;
    paymentGatewayId: number;
    amount: number;
    transactionId: string;
    paidBy?: string;
    notes?: string;
}
export declare const paymentService: {
    /**
     * Create a new payment (client submission)
     */
    createPayment(data: CreatePaymentData): Promise<{
        client: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            companyId: number;
            contactInfo: Prisma.JsonValue | null;
        };
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
            totalAmount: Prisma.Decimal;
        };
        paymentGateway: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            companyId: number;
            instructions: string | null;
            accountType: string;
            accountNumber: string;
        };
        project: {
            status: import(".prisma/client").$Enums.ProjectStatus;
            budget: Prisma.Decimal;
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
        } | null;
    } & {
        status: import(".prisma/client").$Enums.PaymentStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        projectId: number | null;
        clientId: number;
        notes: string | null;
        amount: Prisma.Decimal;
        invoiceId: number;
        paymentGatewayId: number;
        transactionId: string | null;
        paymentMethod: string;
        paidBy: string | null;
        adminNotes: string | null;
        paidAt: Date | null;
        verifiedAt: Date | null;
        verifiedBy: string | null;
    }>;
    /**
     * Get payments by invoice ID
     */
    getPaymentsByInvoice(invoiceId: number, companyId: number): Promise<({
        client: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            companyId: number;
            contactInfo: Prisma.JsonValue | null;
        };
        paymentGateway: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            companyId: number;
            instructions: string | null;
            accountType: string;
            accountNumber: string;
        };
    } & {
        status: import(".prisma/client").$Enums.PaymentStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        projectId: number | null;
        clientId: number;
        notes: string | null;
        amount: Prisma.Decimal;
        invoiceId: number;
        paymentGatewayId: number;
        transactionId: string | null;
        paymentMethod: string;
        paidBy: string | null;
        adminNotes: string | null;
        paidAt: Date | null;
        verifiedAt: Date | null;
        verifiedBy: string | null;
    })[]>;
    /**
     * Get payments by client ID
     */
    getPaymentsByClient(clientId: number, companyId: number): Promise<({
        invoice: {
            id: number;
            invoiceNumber: string;
            totalAmount: Prisma.Decimal;
        };
        paymentGateway: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            companyId: number;
            instructions: string | null;
            accountType: string;
            accountNumber: string;
        };
        project: {
            id: number;
            title: string;
        } | null;
    } & {
        status: import(".prisma/client").$Enums.PaymentStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        projectId: number | null;
        clientId: number;
        notes: string | null;
        amount: Prisma.Decimal;
        invoiceId: number;
        paymentGatewayId: number;
        transactionId: string | null;
        paymentMethod: string;
        paidBy: string | null;
        adminNotes: string | null;
        paidAt: Date | null;
        verifiedAt: Date | null;
        verifiedBy: string | null;
    })[]>;
    /**
     * Get all payments (for admin)
     */
    getAllPayments(companyId: number, filters?: {
        status?: string;
        clientId?: number;
    }): Promise<({
        client: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            companyId: number;
            contactInfo: Prisma.JsonValue | null;
        };
        invoice: {
            id: number;
            invoiceNumber: string;
            totalAmount: Prisma.Decimal;
        };
        paymentGateway: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            companyId: number;
            instructions: string | null;
            accountType: string;
            accountNumber: string;
        };
        project: {
            id: number;
            title: string;
        } | null;
    } & {
        status: import(".prisma/client").$Enums.PaymentStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        projectId: number | null;
        clientId: number;
        notes: string | null;
        amount: Prisma.Decimal;
        invoiceId: number;
        paymentGatewayId: number;
        transactionId: string | null;
        paymentMethod: string;
        paidBy: string | null;
        adminNotes: string | null;
        paidAt: Date | null;
        verifiedAt: Date | null;
        verifiedBy: string | null;
    })[]>;
    /**
     * Approve payment
     */
    approvePayment(paymentId: number, companyId: number, adminId: string, adminNotes?: string): Promise<{
        client: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            companyId: number;
            contactInfo: Prisma.JsonValue | null;
        };
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
            totalAmount: Prisma.Decimal;
        };
        paymentGateway: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            companyId: number;
            instructions: string | null;
            accountType: string;
            accountNumber: string;
        };
        project: {
            status: import(".prisma/client").$Enums.ProjectStatus;
            budget: Prisma.Decimal;
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
        } | null;
    } & {
        status: import(".prisma/client").$Enums.PaymentStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        projectId: number | null;
        clientId: number;
        notes: string | null;
        amount: Prisma.Decimal;
        invoiceId: number;
        paymentGatewayId: number;
        transactionId: string | null;
        paymentMethod: string;
        paidBy: string | null;
        adminNotes: string | null;
        paidAt: Date | null;
        verifiedAt: Date | null;
        verifiedBy: string | null;
    }>;
    /**
     * Reject payment
     */
    rejectPayment(paymentId: number, companyId: number, adminId: string, adminNotes?: string): Promise<{
        client: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            companyId: number;
            contactInfo: Prisma.JsonValue | null;
        };
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
            totalAmount: Prisma.Decimal;
        };
        paymentGateway: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            companyId: number;
            instructions: string | null;
            accountType: string;
            accountNumber: string;
        };
        project: {
            status: import(".prisma/client").$Enums.ProjectStatus;
            budget: Prisma.Decimal;
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
        } | null;
    } & {
        status: import(".prisma/client").$Enums.PaymentStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        projectId: number | null;
        clientId: number;
        notes: string | null;
        amount: Prisma.Decimal;
        invoiceId: number;
        paymentGatewayId: number;
        transactionId: string | null;
        paymentMethod: string;
        paidBy: string | null;
        adminNotes: string | null;
        paidAt: Date | null;
        verifiedAt: Date | null;
        verifiedBy: string | null;
    }>;
    /**
     * Get payment by ID
     */
    getPaymentById(paymentId: number, companyId: number): Promise<{
        client: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            companyId: number;
            contactInfo: Prisma.JsonValue | null;
        };
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
            totalAmount: Prisma.Decimal;
        };
        paymentGateway: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            companyId: number;
            instructions: string | null;
            accountType: string;
            accountNumber: string;
        };
        project: {
            status: import(".prisma/client").$Enums.ProjectStatus;
            budget: Prisma.Decimal;
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
        } | null;
    } & {
        status: import(".prisma/client").$Enums.PaymentStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        projectId: number | null;
        clientId: number;
        notes: string | null;
        amount: Prisma.Decimal;
        invoiceId: number;
        paymentGatewayId: number;
        transactionId: string | null;
        paymentMethod: string;
        paidBy: string | null;
        adminNotes: string | null;
        paidAt: Date | null;
        verifiedAt: Date | null;
        verifiedBy: string | null;
    }>;
};
export {};
//# sourceMappingURL=payment.service.d.ts.map