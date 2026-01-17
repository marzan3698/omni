import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
export const budgetService = {
    /**
     * Get all budgets for a company
     */
    async getAllBudgets(companyId) {
        const budgets = await prisma.budget.findMany({
            where: { companyId },
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
        // Calculate spent amount for each budget
        const budgetsWithSpent = await Promise.all(budgets.map(async (budget) => {
            const spent = await this.calculateBudgetSpent(budget.id, budget.startDate, budget.endDate, budget.categoryId);
            return {
                ...budget,
                spent: Number(spent),
                remaining: Number(budget.amount) - Number(spent),
                percentageUsed: (Number(spent) / Number(budget.amount)) * 100,
            };
        }));
        return budgetsWithSpent;
    },
    /**
     * Get budget by ID
     */
    async getBudgetById(id, companyId) {
        const budget = await prisma.budget.findFirst({
            where: {
                id,
                companyId,
            },
            include: {
                category: true,
            },
        });
        if (!budget) {
            throw new AppError('Budget not found', 404);
        }
        const spent = await this.calculateBudgetSpent(budget.id, budget.startDate, budget.endDate, budget.categoryId);
        return {
            ...budget,
            spent: Number(spent),
            remaining: Number(budget.amount) - Number(spent),
            percentageUsed: (Number(spent) / Number(budget.amount)) * 100,
        };
    },
    /**
     * Calculate spent amount for a budget
     */
    async calculateBudgetSpent(budgetId, startDate, endDate, categoryId) {
        const transactions = await prisma.transaction.findMany({
            where: {
                type: 'Debit',
                date: {
                    gte: startDate,
                    lte: endDate,
                },
                ...(categoryId && { categoryId }),
            },
        });
        return transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    },
    /**
     * Create budget
     */
    async createBudget(data) {
        // Verify category if provided
        if (data.categoryId) {
            const category = await prisma.expenseCategory.findFirst({
                where: {
                    id: data.categoryId,
                    companyId: data.companyId,
                },
            });
            if (!category) {
                throw new AppError('Category not found', 404);
            }
        }
        return await prisma.budget.create({
            data: {
                companyId: data.companyId,
                name: data.name,
                categoryId: data.categoryId,
                amount: data.amount,
                period: data.period,
                startDate: data.startDate,
                endDate: data.endDate,
            },
            include: {
                category: true,
            },
        });
    },
    /**
     * Update budget
     */
    async updateBudget(id, companyId, data) {
        const budget = await prisma.budget.findFirst({
            where: {
                id,
                companyId,
            },
        });
        if (!budget) {
            throw new AppError('Budget not found', 404);
        }
        // Verify category if provided
        if (data.categoryId) {
            const category = await prisma.expenseCategory.findFirst({
                where: {
                    id: data.categoryId,
                    companyId,
                },
            });
            if (!category) {
                throw new AppError('Category not found', 404);
            }
        }
        return await prisma.budget.update({
            where: { id },
            data,
            include: {
                category: true,
            },
        });
    },
    /**
     * Delete budget
     */
    async deleteBudget(id, companyId) {
        const budget = await prisma.budget.findFirst({
            where: {
                id,
                companyId,
            },
        });
        if (!budget) {
            throw new AppError('Budget not found', 404);
        }
        return await prisma.budget.delete({
            where: { id },
        });
    },
};
//# sourceMappingURL=budget.service.js.map