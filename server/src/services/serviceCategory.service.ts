import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

interface CreateServiceCategoryData {
  companyId: number;
  name: string;
  parentId?: number | null;
  description?: string;
  iconName?: string;
  iconUrl?: string;
}

interface UpdateServiceCategoryData {
  name?: string;
  parentId?: number | null;
  description?: string;
  iconName?: string | null;
  iconUrl?: string | null;
}

export const serviceCategoryService = {
  async getAllCategories(companyId: number, parentIdFilter?: number | null) {
    const where: { companyId: number; parentId?: number | null } = { companyId };
    if (parentIdFilter !== undefined) {
      where.parentId = parentIdFilter;
    }
    return await prisma.serviceCategory.findMany({
      where,
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, iconName: true, iconUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getCategoryById(id: number, companyId: number) {
    const category = await prisma.serviceCategory.findFirst({
      where: { id, companyId },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
      },
    });

    if (!category) {
      throw new AppError('Service category not found', 404);
    }

    return category;
  },

  async createCategory(data: CreateServiceCategoryData) {
    const company = await prisma.company.findFirst({
      where: { id: data.companyId },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    const parentId = data.parentId && data.parentId > 0 ? data.parentId : null;
    if (parentId) {
      const parent = await prisma.serviceCategory.findFirst({
        where: { id: parentId, companyId: data.companyId },
      });
      if (!parent) {
        throw new AppError('Parent category not found or does not belong to your company', 400);
      }
    }

    return await prisma.serviceCategory.create({
      data: {
        companyId: data.companyId,
        parentId,
        name: data.name,
        description: data.description || null,
        iconName: data.iconName || null,
        iconUrl: data.iconUrl || null,
      },
    });
  },

  async updateCategory(id: number, data: UpdateServiceCategoryData, companyId: number) {
    const category = await prisma.serviceCategory.findFirst({
      where: { id, companyId },
    });

    if (!category) {
      throw new AppError('Service category not found', 404);
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.parentId !== undefined) updateData.parentId = data.parentId ?? null;
    if (data.description !== undefined) updateData.description = data.description ?? null;
    if (data.iconName !== undefined) updateData.iconName = data.iconName ?? null;
    if (data.iconUrl !== undefined) updateData.iconUrl = data.iconUrl ?? null;

    return await prisma.serviceCategory.update({
      where: { id },
      data: updateData,
    });
  },

  async deleteCategory(id: number, companyId: number) {
    const category = await prisma.serviceCategory.findFirst({
      where: { id, companyId },
      include: {
        services: { select: { id: true } },
        children: { select: { id: true } },
      },
    });

    if (!category) {
      throw new AppError('Service category not found', 404);
    }

    if (category.services.length > 0) {
      throw new AppError('Cannot delete category with existing services', 400);
    }

    if (category.children.length > 0) {
      throw new AppError('Cannot delete category with sub-categories. Remove sub-categories first.', 400);
    }

    await prisma.serviceCategory.delete({
      where: { id },
    });

    return { message: 'Service category deleted successfully' };
  },
};
