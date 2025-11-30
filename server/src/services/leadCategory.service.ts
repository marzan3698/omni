import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const leadCategoryService = {
  async createCategory(companyId: number, data: { name: string; isActive?: boolean }) {
    const category = await prisma.leadCategory.create({
      data: {
        companyId,
        name: data.name,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
    return category;
  },

  async getCategories(companyId: number) {
    const categories = await prisma.leadCategory.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
    return categories;
  },

  async getCategoryById(id: number, companyId: number) {
    const category = await prisma.leadCategory.findFirst({
      where: { id, companyId },
    });
    if (!category) {
      throw new AppError('Lead category not found', 404);
    }
    return category;
  },

  async updateCategory(id: number, companyId: number, data: { name?: string; isActive?: boolean }) {
    await this.getCategoryById(id, companyId); // Verify exists
    const category = await prisma.leadCategory.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    return category;
  },

  async deleteCategory(id: number, companyId: number) {
    await this.getCategoryById(id, companyId); // Verify exists
    await prisma.leadCategory.delete({
      where: { id },
    });
    return { success: true };
  },
};

