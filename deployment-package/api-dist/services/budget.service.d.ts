interface CreateBudgetData {
    companyId: number;
    name: string;
    categoryId?: number;
    amount: number;
    period: string;
    startDate: Date;
    endDate: Date;
}
interface UpdateBudgetData {
    name?: string;
    categoryId?: number;
    amount?: number;
    period?: string;
    startDate?: Date;
    endDate?: Date;
}
export declare const budgetService: {
    /**
     * Get all budgets for a company
     */
    getAllBudgets(companyId: number): Promise<{
        spent: number;
        remaining: number;
        percentageUsed: number;
        category: {
            id: number;
            name: string;
        } | null;
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        startDate: Date;
        endDate: Date;
        categoryId: number | null;
        amount: import("@prisma/client/runtime/library.js").Decimal;
        period: string;
    }[]>;
    /**
     * Get budget by ID
     */
    getBudgetById(id: number, companyId: number): Promise<{
        spent: number;
        remaining: number;
        percentageUsed: number;
        category: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: number;
            description: string | null;
        } | null;
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        startDate: Date;
        endDate: Date;
        categoryId: number | null;
        amount: import("@prisma/client/runtime/library.js").Decimal;
        period: string;
    }>;
    /**
     * Calculate spent amount for a budget
     */
    calculateBudgetSpent(budgetId: number, startDate: Date, endDate: Date, categoryId?: number | null): Promise<number>;
    /**
     * Create budget
     */
    createBudget(data: CreateBudgetData): Promise<{
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
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        startDate: Date;
        endDate: Date;
        categoryId: number | null;
        amount: import("@prisma/client/runtime/library.js").Decimal;
        period: string;
        spent: import("@prisma/client/runtime/library.js").Decimal;
    }>;
    /**
     * Update budget
     */
    updateBudget(id: number, companyId: number, data: UpdateBudgetData): Promise<{
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
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        startDate: Date;
        endDate: Date;
        categoryId: number | null;
        amount: import("@prisma/client/runtime/library.js").Decimal;
        period: string;
        spent: import("@prisma/client/runtime/library.js").Decimal;
    }>;
    /**
     * Delete budget
     */
    deleteBudget(id: number, companyId: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        startDate: Date;
        endDate: Date;
        categoryId: number | null;
        amount: import("@prisma/client/runtime/library.js").Decimal;
        period: string;
        spent: import("@prisma/client/runtime/library.js").Decimal;
    }>;
};
export {};
//# sourceMappingURL=budget.service.d.ts.map