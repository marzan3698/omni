interface CreatePaymentGatewayData {
    companyId: number;
    name: string;
    accountType: string;
    accountNumber: string;
    instructions?: string;
    isActive?: boolean;
}
interface UpdatePaymentGatewayData {
    name?: string;
    accountType?: string;
    accountNumber?: string;
    instructions?: string;
    isActive?: boolean;
}
export declare const paymentGatewayService: {
    /**
     * Get all payment gateways for a company
     */
    getAll(companyId: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
        instructions: string | null;
        accountType: string;
        accountNumber: string;
    }[]>;
    /**
     * Get active payment gateways for a company
     */
    getActiveGateways(companyId: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
        instructions: string | null;
        accountType: string;
        accountNumber: string;
    }[]>;
    /**
     * Get payment gateway by ID
     */
    getById(id: number, companyId: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
        instructions: string | null;
        accountType: string;
        accountNumber: string;
    }>;
    /**
     * Create a new payment gateway
     */
    create(data: CreatePaymentGatewayData): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
        instructions: string | null;
        accountType: string;
        accountNumber: string;
    }>;
    /**
     * Update payment gateway
     */
    update(id: number, companyId: number, data: UpdatePaymentGatewayData): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
        instructions: string | null;
        accountType: string;
        accountNumber: string;
    }>;
    /**
     * Delete payment gateway
     */
    delete(id: number, companyId: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
        instructions: string | null;
        accountType: string;
        accountNumber: string;
    }>;
};
export {};
//# sourceMappingURL=paymentGateway.service.d.ts.map