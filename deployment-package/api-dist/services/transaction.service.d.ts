import { TransactionType } from '@prisma/client';
interface CreateTransactionData {
    companyId: number;
    type: TransactionType;
    categoryId?: number;
    amount: number;
    date: Date;
    description?: string;
    reference?: string;
}
interface UpdateTransactionData {
    type?: TransactionType;
    categoryId?: number;
    amount?: number;
    date?: Date;
    description?: string;
    reference?: string;
}
export declare const transactionService: {
    /**
     * Get all transactions for a company
     */
    getAllTransactions(companyId: number, filters?: {
        type?: TransactionType;
        categoryId?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<({
        category: {
            id: number;
            name: string;
        } | null;
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        type: import(".prisma/client").$Enums.TransactionType;
        description: string | null;
        date: Date;
        categoryId: number | null;
        amount: import("@prisma/client/runtime/library.js").Decimal;
        reference: string | null;
    })[]>;
    /**
     * Get transaction by ID
     */
    getTransactionById(id: number, companyId: number): Promise<{
        category: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: number;
            description: string | null;
        } | null;
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        type: import(".prisma/client").$Enums.TransactionType;
        description: string | null;
        date: Date;
        categoryId: number | null;
        amount: import("@prisma/client/runtime/library.js").Decimal;
        reference: string | null;
    }>;
    /**
     * Create transaction
     */
    createTransaction(data: CreateTransactionData): Promise<{
        category: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: number;
            description: string | null;
        } | null;
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        type: import(".prisma/client").$Enums.TransactionType;
        description: string | null;
        date: Date;
        categoryId: number | null;
        amount: import("@prisma/client/runtime/library.js").Decimal;
        reference: string | null;
    }>;
    /**
     * Update transaction
     */
    updateTransaction(id: number, companyId: number, data: UpdateTransactionData): Promise<{
        category: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: number;
            description: string | null;
        } | null;
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        type: import(".prisma/client").$Enums.TransactionType;
        description: string | null;
        date: Date;
        categoryId: number | null;
        amount: import("@prisma/client/runtime/library.js").Decimal;
        reference: string | null;
    }>;
    /**
     * Delete transaction
     */
    deleteTransaction(id: number, companyId: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        type: import(".prisma/client").$Enums.TransactionType;
        description: string | null;
        date: Date;
        categoryId: number | null;
        amount: import("@prisma/client/runtime/library.js").Decimal;
        reference: string | null;
    }>;
    /**
     * Get financial summary
     */
    getFinancialSummary(companyId: number, startDate?: Date, endDate?: Date): Promise<{
        income: number;
        expenses: number;
        profit: number;
        expensesByCategory: Record<string, number>;
        totalTransactions: number;
    }>;
};
export {};
//# sourceMappingURL=transaction.service.d.ts.map