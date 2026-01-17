interface CreateExpenseCategoryData {
    companyId: number;
    name: string;
    description?: string;
}
interface UpdateExpenseCategoryData {
    name?: string;
    description?: string;
}
export declare const expenseCategoryService: {
    /**
     * Get all expense categories for a company
     */
    getAllCategories(companyId: number): Promise<({
        _count: {
            transactions: number;
            budgets: number;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string | null;
    })[]>;
    /**
     * Get category by ID
     */
    getCategoryById(id: number, companyId: number): Promise<{
        _count: {
            transactions: number;
            budgets: number;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string | null;
    }>;
    /**
     * Create expense category
     */
    createCategory(data: CreateExpenseCategoryData): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string | null;
    }>;
    /**
     * Update expense category
     */
    updateCategory(id: number, companyId: number, data: UpdateExpenseCategoryData): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string | null;
    }>;
    /**
     * Delete expense category
     */
    deleteCategory(id: number, companyId: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string | null;
    }>;
};
export {};
//# sourceMappingURL=expenseCategory.service.d.ts.map