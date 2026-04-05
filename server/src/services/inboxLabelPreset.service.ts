import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const inboxLabelPresetService = {
  /**
   * Get all labeling presets for a company
   */
  async getAll(companyId: number) {
    return await prisma.inboxLabelPreset.findMany({
      where: { companyId },
      orderBy: { sortOrder: 'asc' },
    });
  },

  /**
   * Get public/active presets
   */
  async getActive(companyId: number) {
    return await prisma.inboxLabelPreset.findMany({
      where: { 
        companyId,
        isActive: true 
      },
      orderBy: { sortOrder: 'asc' },
    });
  },

  /**
   * Create a new preset
   */
  async create(data: {
    companyId: number;
    name: string;
    color?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    return await prisma.inboxLabelPreset.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        color: data.color,
        description: data.description,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  },

  /**
   * Update an existing preset
   */
  async update(id: number, companyId: number, data: {
    name?: string;
    color?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    return await prisma.inboxLabelPreset.update({
      where: { id, companyId },
      data,
    });
  },

  /**
   * Delete a preset
   */
  async delete(id: number, companyId: number) {
    return await prisma.inboxLabelPreset.delete({
      where: { id, companyId },
    });
  },
};
