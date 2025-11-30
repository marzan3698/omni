import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

interface CreateProductCategoryData {
  companyId: number;
  name: string;
  description?: string;
}

interface UpdateProductCategoryData {
  name?: string;
  description?: string;
}

export const productCategoryService = {
  async getAllCategories(companyId: number) {
    return await prisma.productCategory.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getCategoryById(id: number, companyId: number) {
    const category = await prisma.productCategory.findFirst({
      where: { id, companyId },
    });

    if (!category) {
      throw new AppError('Product category not found', 404);
    }

    return category;
  },

  async createCategory(data: CreateProductCategoryData) {
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

  async updateCategory(id: number, data: UpdateProductCategoryData, companyId: number) {
    const category = await prisma.productCategory.findFirst({
      where: { id, companyId },
    });

    if (!category) {
      throw new AppError('Product category not found', 404);
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description || null;

    return await prisma.productCategory.update({
      where: { id },
      data: updateData,
    });
  },

  async deleteCategory(id: number, companyId: number) {
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

