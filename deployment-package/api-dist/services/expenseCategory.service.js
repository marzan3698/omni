import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
export const expenseCategoryService = {
    /**
     * Get all expense categories for a company
     */
    async getAllCategories(companyId) {
        return await prisma.expenseCategory.findMany({
            where: { companyId },
            include: {
                _count: {
                    select: {
                        transactions: true,
                        budgets: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    },
    /**
     * Get category by ID
     */
    async getCategoryById(id, companyId) {
        const category = await prisma.expenseCategory.findFirst({
            where: {
                id,
                companyId,
            },
            include: {
                _count: {
                    select: {
                        transactions: true,
                        budgets: true,
                    },
                },
            },
        });
        if (!category) {
            throw new AppError('Category not found', 404);
        }
        return category;
    },
    /**
     * Create expense category
     */
    async createCategory(data) {
        return await prisma.expenseCategory.create({
            data: {
                companyId: data.companyId,
                name: data.name,
                description: data.description,
            },
        });
    },
    /**
     * Update expense category
     */
    async updateCategory(id, companyId, data) {
        const category = await prisma.expenseCategory.findFirst({
            where: {
                id,
                companyId,
            },
        });
        if (!category) {
            throw new AppError('Category not found', 404);
        }
        return await prisma.expenseCategory.update({
            where: { id },
            data,
        });
    },
    /**
     * Delete expense category
     */
    async deleteCategory(id, companyId) {
        const category = await prisma.expenseCategory.findFirst({
            where: {
                id,
                companyId,
            },
        });
        if (!category) {
            throw new AppError('Category not found', 404);
        }
        return await prisma.expenseCategory.delete({
            where: { id },
        });
    },
};
//# sourceMappingURL=expenseCategory.service.js.map