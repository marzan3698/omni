import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
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

export const transactionService = {
  /**
   * Get all transactions for a company
   */
  async getAllTransactions(companyId: number, filters?: {
    type?: TransactionType;
    categoryId?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    return await prisma.transaction.findMany({
      where: {
        companyId,
        ...(filters?.type && { type: filters.type }),
        ...(filters?.categoryId && { categoryId: filters.categoryId }),
        ...(filters?.startDate && filters?.endDate && {
          date: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  },

  /**
   * Get transaction by ID
   */
  async getTransactionById(id: number, companyId: number) {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        category: true,
      },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    return transaction;
  },

  /**
   * Create transaction
   */
  async createTransaction(data: CreateTransactionData) {
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

    return await prisma.transaction.create({
      data: {
        companyId: data.companyId,
        type: data.type,
        categoryId: data.categoryId,
        amount: data.amount,
        date: data.date,
        description: data.description,
        reference: data.reference,
      },
      include: {
        category: true,
      },
    });
  },

  /**
   * Update transaction
   */
  async updateTransaction(id: number, companyId: number, data: UpdateTransactionData) {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
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

    return await prisma.transaction.update({
      where: { id },
      data,
      include: {
        category: true,
      },
    });
  },

  /**
   * Delete transaction
   */
  async deleteTransaction(id: number, companyId: number) {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    return await prisma.transaction.delete({
      where: { id },
    });
  },

  /**
   * Get financial summary
   */
  async getFinancialSummary(companyId: number, startDate?: Date, endDate?: Date) {
    const where: any = { companyId };
    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
      },
    });

    const income = transactions
      .filter(t => t.type === 'Credit')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter(t => t.type === 'Debit')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const profit = income - expenses;

    // Group by category
    const expensesByCategory = transactions
      .filter(t => t.type === 'Debit')
      .reduce((acc, t) => {
        const categoryName = t.category?.name || 'Uncategorized';
        acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);

    return {
      income,
      expenses,
      profit,
      expensesByCategory,
      totalTransactions: transactions.length,
    };
  },
};

