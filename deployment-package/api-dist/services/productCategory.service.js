import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
export const productCategoryService = {
    async getAllCategories(companyId) {
        return await prisma.productCategory.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
        });
    },
    async getCategoryById(id, companyId) {
        const category = await prisma.productCategory.findFirst({
            where: { id, companyId },
        });
        if (!category) {
            throw new AppError('Product category not found', 404);
        }
        return category;
    },
    async createCategory(data) {
        // Validate company exists
        const company = await prisma.company.findFirst({
            where: { id: data.companyId },
        });
        if (!company) {
            throw new AppError('Company not found', 404);
        }
        return await prisma.productCategory.create({
            data: {
                companyId: data.companyId,
                name: data.name,
                description: data.description || null,
            },
        });
    },
    async updateCategory(id, data, companyId) {
        const category = await prisma.productCategory.findFirst({
            where: { id, companyId },
        });
        if (!category) {
            throw new AppError('Product category not found', 404);
        }
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.description !== undefined)
            updateData.description = data.description || null;
        return await prisma.productCategory.update({
            where: { id },
            data: updateData,
        });
    },
    async deleteCategory(id, companyId) {
        const category = await prisma.productCategory.findFirst({
            where: { id, companyId },
            include: {
                products: {
                    select: { id: true },
                },
            },
        });
        if (!category) {
            throw new AppError('Product category not found', 404);
        }
        // Check if category has products
        if (category.products.length > 0) {
            throw new AppError('Cannot delete category with existing products', 400);
        }
        await prisma.productCategory.delete({
            where: { id },
        });
        return { message: 'Product category deleted successfully' };
    },
};
//# sourceMappingURL=productCategory.service.js.map