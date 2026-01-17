interface CreateProductCategoryData {
    companyId: number;
    name: string;
    description?: string;
}
interface UpdateProductCategoryData {
    name?: string;
    description?: string;
}
export declare const productCategoryService: {
    getAllCategories(companyId: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string | null;
    }[]>;
    getCategoryById(id: number, companyId: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string | null;
    }>;
    createCategory(data: CreateProductCategoryData): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string | null;
    }>;
    updateCategory(id: number, data: UpdateProductCategoryData, companyId: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string | null;
    }>;
    deleteCategory(id: number, companyId: number): Promise<{
        message: string;
    }>;
};
export {};
//# sourceMappingURL=productCategory.service.d.ts.map