import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const leadPriorityService = {
  async create(companyId: number, data: { name: string; sortOrder?: number; isActive?: boolean }) {
    const priority = await prisma.leadPriority.create({
      data: {
        companyId,
        name: data.name,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
    return priority;
  },

  async getAll(companyId: number) {
    const priorities = await prisma.leadPriority.findMany({
      where: { companyId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return priorities;
  },

  async getById(id: number, companyId: number) {
    const priority = await prisma.leadPriority.findFirst({
      where: { id, companyId },
    });
    if (!priority) {
      throw new AppError('Lead priority not found', 404);
    }
    return priority;
  },

  async update(id: number, companyId: number, data: { name?: string; sortOrder?: number; isActive?: boolean }) {
    await this.getById(id, companyId);
    const priority = await prisma.leadPriority.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    return priority;
  },

  async delete(id: number, companyId: number) {
    await this.getById(id, companyId);
    await prisma.leadPriority.delete({ where: { id } });
    return { success: true };
  },
};
