import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const leadInterestService = {
  async createInterest(companyId: number, data: { name: string; isActive?: boolean }) {
    const interest = await prisma.leadInterest.create({
      data: {
        companyId,
        name: data.name,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
    return interest;
  },

  async getInterests(companyId: number) {
    const interests = await prisma.leadInterest.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
    return interests;
  },

  async getInterestById(id: number, companyId: number) {
    const interest = await prisma.leadInterest.findFirst({
      where: { id, companyId },
    });
    if (!interest) {
      throw new AppError('Lead interest not found', 404);
    }
    return interest;
  },

  async updateInterest(id: number, companyId: number, data: { name?: string; isActive?: boolean }) {
    await this.getInterestById(id, companyId); // Verify exists
    const interest = await prisma.leadInterest.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    return interest;
  },

  async deleteInterest(id: number, companyId: number) {
    await this.getInterestById(id, companyId); // Verify exists
    await prisma.leadInterest.delete({
      where: { id },
    });
    return { success: true };
  },
};

