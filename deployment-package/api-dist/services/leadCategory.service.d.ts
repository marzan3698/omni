export declare const leadCategoryService: {
    createCategory(companyId: number, data: {
        name: string;
        isActive?: boolean;
    }): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
    }>;
    getCategories(companyId: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
    }[]>;
    getAllCategories(): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
    }[]>;
    getCategoryById(id: number, companyId: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
    }>;
    updateCategory(id: number, companyId: number, data: {
        name?: string;
        isActive?: boolean;
    }): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
    }>;
    deleteCategory(id: number, companyId: number): Promise<{
        success: boolean;
    }>;
};
//# sourceMappingURL=leadCategory.service.d.ts.map