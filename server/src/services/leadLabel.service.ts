import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const leadLabelService = {
  async create(companyId: number, data: { name: string; color?: string; isActive?: boolean }) {
    const label = await prisma.leadLabel.create({
      data: {
        companyId,
        name: data.name,
        color: data.color ?? null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
    return label;
  },

  async getAll(companyId: number) {
    const labels = await prisma.leadLabel.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
    return labels;
  },

  async getById(id: number, companyId: number) {
    const label = await prisma.leadLabel.findFirst({
      where: { id, companyId },
    });
    if (!label) {
      throw new AppError('Lead label not found', 404);
    }
    return label;
  },

  async update(id: number, companyId: number, data: { name?: string; color?: string; isActive?: boolean }) {
    await this.getById(id, companyId);
    const label = await prisma.leadLabel.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    return label;
  },

  async delete(id: number, companyId: number) {
    await this.getById(id, companyId);
    await prisma.leadLabel.delete({ where: { id } });
    return { success: true };
  },
};
