import { Currency, Prisma } from '@prisma/client';
interface CreateProductData {
    companyId: number;
    categoryId: number;
    name: string;
    description?: string;
    purchasePrice: number;
    salePrice: number;
    currency: Currency;
    productCompany?: string;
    imageUrl?: string;
    quickReplies?: Array<{
        type: 'attribute' | 'sales';
        key?: string;
        value: string;
    }>;
}
interface UpdateProductData {
    categoryId?: number;
    name?: string;
    description?: string;
    purchasePrice?: number;
    salePrice?: number;
    currency?: Currency;
    productCompany?: string;
    imageUrl?: string;
    quickReplies?: Array<{
        type: 'attribute' | 'sales';
        key?: string;
        value: string;
    }>;
}
export declare const productService: {
    getAllProducts(companyId: number, filters?: {
        categoryId?: number;
        search?: string;
    }): Promise<({
        category: {
            id: number;
            name: string;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string | null;
        imageUrl: string | null;
        categoryId: number;
        purchasePrice: Prisma.Decimal;
        salePrice: Prisma.Decimal;
        currency: import(".prisma/client").$Enums.Currency;
        productCompany: string | null;
        quickReplies: Prisma.JsonValue | null;
    })[]>;
    getProductById(id: number, companyId: number): Promise<{
        category: {
            id: number;
            name: string;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string | null;
        imageUrl: string | null;
        categoryId: number;
        purchasePrice: Prisma.Decimal;
        salePrice: Prisma.Decimal;
        currency: import(".prisma/client").$Enums.Currency;
        productCompany: string | null;
        quickReplies: Prisma.JsonValue | null;
    }>;
    createProduct(data: CreateProductData): Promise<{
        category: {
            id: number;
            name: string;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string | null;
        imageUrl: string | null;
        categoryId: number;
        purchasePrice: Prisma.Decimal;
        salePrice: Prisma.Decimal;
        currency: import(".prisma/client").$Enums.Currency;
        productCompany: string | null;
        quickReplies: Prisma.JsonValue | null;
    }>;
    updateProduct(id: number, data: UpdateProductData, companyId: number): Promise<{
        category: {
            id: number;
            name: string;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string | null;
        imageUrl: string | null;
        categoryId: number;
        purchasePrice: Prisma.Decimal;
        salePrice: Prisma.Decimal;
        currency: import(".prisma/client").$Enums.Currency;
        productCompany: string | null;
        quickReplies: Prisma.JsonValue | null;
    }>;
    deleteProduct(id: number, companyId: number): Promise<{
        message: string;
    }>;
};
export {};
//# sourceMappingURL=product.service.d.ts.map