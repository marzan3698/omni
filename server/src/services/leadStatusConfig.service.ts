import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

const SYSTEM_CODES = ['Won', 'Lost'];

async function ensureSystemStatuses(companyId: number) {
  const existing = await prisma.leadStatusConfig.findMany({
    where: { companyId, code: { in: SYSTEM_CODES } },
  });
  const existingCodes = existing.map((s) => s.code);
  const toCreate = SYSTEM_CODES.filter((c) => !existingCodes.includes(c));
  if (toCreate.length === 0) return;

  const defaults: Record<string, { name: string; sortOrder: number }> = {
    Won: { name: 'Won', sortOrder: 100 },
    Lost: { name: 'Lost', sortOrder: 101 },
  };
  for (const code of toCreate) {
    await prisma.leadStatusConfig.create({
      data: {
        companyId,
        name: defaults[code].name,
        code,
        sortOrder: defaults[code].sortOrder,
        isSystem: true,
        isActive: true,
      },
    });
  }
}

export const leadStatusConfigService = {
  async create(companyId: number, data: { name: string; code: string; sortOrder?: number; isActive?: boolean }) {
    if (SYSTEM_CODES.includes(data.code)) {
      throw new AppError('Cannot create status with reserved code Won or Lost', 400);
    }
    const status = await prisma.leadStatusConfig.create({
      data: {
        companyId,
        name: data.name,
        code: data.code,
        sortOrder: data.sortOrder ?? 0,
        isSystem: false,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
    return status;
  },

  async getAll(companyId: number) {
    await ensureSystemStatuses(companyId);
    const statuses = await prisma.leadStatusConfig.findMany({
      where: { companyId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return statuses;
  },

  async getById(id: number, companyId: number) {
    const status = await prisma.leadStatusConfig.findFirst({
      where: { id, companyId },
    });
    if (!status) {
      throw new AppError('Lead status not found', 404);
    }
    return status;
  },

  async update(id: number, companyId: number, data: { name?: string; code?: string; sortOrder?: number; isActive?: boolean }) {
    const existing = await this.getById(id, companyId);
    if (existing.isSystem) {
      throw new AppError('System statuses (Won, Lost) cannot be edited', 400);
    }
    const status = await prisma.leadStatusConfig.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    return status;
  },

  async delete(id: number, companyId: number) {
    const existing = await this.getById(id, companyId);
    if (existing.isSystem) {
      throw new AppError('System statuses (Won, Lost) cannot be deleted', 400);
    }
    await prisma.leadStatusConfig.delete({ where: { id } });
    return { success: true };
  },

  async resolveStatusId(companyId: number, statusStr: string): Promise<number | null> {
    const normalized = statusStr?.trim();
    if (!normalized) return null;
    const status = await prisma.leadStatusConfig.findFirst({
      where: {
        companyId,
        isActive: true,
        OR: [{ code: normalized }, { name: normalized }],
      },
    });
    return status?.id ?? null;
  },

  async getDefaultStatusId(companyId: number): Promise<number> {
    await ensureSystemStatuses(companyId);
    const status = await prisma.leadStatusConfig.findFirst({
      where: { companyId, isSystem: false, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    if (!status) {
      const newStatus = await prisma.leadStatusConfig.findFirst({
        where: { companyId, code: 'New' },
      });
      if (newStatus) return newStatus.id;
      throw new AppError('No lead status configured for company', 500);
    }
    return status.id;
  },
};
