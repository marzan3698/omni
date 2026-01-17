import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { Prisma } from '@prisma/client';
export const productService = {
    async getAllProducts(companyId, filters) {
        const where = { companyId };
        if (filters?.categoryId) {
            where.categoryId = filters.categoryId;
        }
        if (filters?.search) {
            // MySQL with utf8mb4_unicode_ci collation is case-insensitive by default
            // Trim and use contains for partial matching
            const searchTerm = filters.search.trim();
            if (searchTerm) {
                // Use OR condition to search in both name and description
                where.OR = [
                    { name: { contains: searchTerm } },
                    { description: { contains: searchTerm } },
                ];
            }
        }
        const products = await prisma.product.findMany({
            where,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        // Debug logging (remove in production)
        if (filters?.search) {
            console.log('Product search:', {
                searchTerm: filters.search,
                found: products.length,
                products: products.map(p => p.name),
            });
        }
        return products;
    },
    async getProductById(id, companyId) {
        const product = await prisma.product.findFirst({
            where: { id, companyId },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        if (!product) {
            throw new AppError('Product not found', 404);
        }
        return product;
    },
    async createProduct(data) {
        // Validate prices
        if (data.purchasePrice <= 0 || data.salePrice <= 0) {
            throw new AppError('Prices must be greater than 0', 400);
        }
        // Validate category exists
        const category = await prisma.productCategory.findFirst({
            where: { id: data.categoryId, companyId: data.companyId },
        });
        if (!category) {
            throw new AppError('Product category not found', 404);
        }
        // Validate company exists
        const company = await prisma.company.findFirst({
            where: { id: data.companyId },
        });
        if (!company) {
            throw new AppError('Company not found', 404);
        }
        return await prisma.product.create({
            data: {
                companyId: data.companyId,
                categoryId: data.categoryId,
                name: data.name,
                description: data.description || null,
                purchasePrice: new Prisma.Decimal(data.purchasePrice),
                salePrice: new Prisma.Decimal(data.salePrice),
                currency: data.currency,
                productCompany: data.productCompany || null,
                imageUrl: data.imageUrl || null,
                quickReplies: data.quickReplies ? data.quickReplies : null,
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    },
    async updateProduct(id, data, companyId) {
        // Check if product exists and belongs to company
        const existingProduct = await prisma.product.findFirst({
            where: { id, companyId },
        });
        if (!existingProduct) {
            throw new AppError('Product not found', 404);
        }
        // Validate prices if provided
        if (data.purchasePrice !== undefined && data.purchasePrice <= 0) {
            throw new AppError('Purchase price must be greater than 0', 400);
        }
        if (data.salePrice !== undefined && data.salePrice <= 0) {
            throw new AppError('Sale price must be greater than 0', 400);
        }
        // Validate category if provided
        if (data.categoryId) {
            const category = await prisma.productCategory.findFirst({
                where: { id: data.categoryId, companyId },
            });
            if (!category) {
                throw new AppError('Product category not found', 404);
            }
        }
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.description !== undefined)
            updateData.description = data.description || null;
        if (data.purchasePrice !== undefined)
            updateData.purchasePrice = new Prisma.Decimal(data.purchasePrice);
        if (data.salePrice !== undefined)
            updateData.salePrice = new Prisma.Decimal(data.salePrice);
        if (data.currency !== undefined)
            updateData.currency = data.currency;
        if (data.categoryId !== undefined)
            updateData.categoryId = data.categoryId;
        if (data.productCompany !== undefined)
            updateData.productCompany = data.productCompany || null;
        if (data.imageUrl !== undefined)
            updateData.imageUrl = data.imageUrl || null;
        if (data.quickReplies !== undefined)
            updateData.quickReplies = data.quickReplies ? data.quickReplies : null;
        return await prisma.product.update({
            where: { id },
            data: updateData,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    },
    async deleteProduct(id, companyId) {
        const product = await prisma.product.findFirst({
            where: { id, companyId },
        });
        if (!product) {
            throw new AppError('Product not found', 404);
        }
        // Delete image file if exists
        if (product.imageUrl) {
            const fs = await import('fs');
            const path = await import('path');
            const imagePath = path.join(process.cwd(), product.imageUrl.replace('/uploads/', 'uploads/'));
            try {
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
            catch (error) {
                console.error('Error deleting image file:', error);
            }
        }
        await prisma.product.delete({
            where: { id },
        });
        return { message: 'Product deleted successfully' };
    },
};
//# sourceMappingURL=product.service.js.map