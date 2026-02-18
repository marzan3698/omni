import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

interface ServiceAttributes {
  keyValuePairs?: { [key: string]: string };
  tags?: string[];
}

interface CreateServiceData {
  companyId: number;
  categoryId: number;
  title: string;
  details: string;
  pricing: number;
  useDeliveryDate?: boolean;
  durationDays?: number;
  deliveryStartDate?: Date;
  deliveryEndDate?: Date;
  currency?: string;
  attributes: ServiceAttributes;
}

interface UpdateServiceData {
  categoryId?: number;
  title?: string;
  details?: string;
  pricing?: number;
  useDeliveryDate?: boolean;
  durationDays?: number | null;
  deliveryStartDate?: Date | null;
  deliveryEndDate?: Date | null;
  currency?: string;
  attributes?: ServiceAttributes;
  isActive?: boolean;
}

export const serviceService = {
  /**
   * Create a new service
   */
  async createService(data: CreateServiceData) {
    const useDelivery = data.useDeliveryDate !== false;

    if (useDelivery && data.deliveryStartDate && data.deliveryEndDate) {
      if (data.deliveryStartDate >= data.deliveryEndDate) {
        throw new AppError('Delivery end date must be after start date', 400);
      }
    } else if (!useDelivery && (!data.durationDays || data.durationDays < 1)) {
      throw new AppError('Duration (days) is required when delivery date is disabled', 400);
    }

    if (data.attributes) {
      if (data.attributes.keyValuePairs && typeof data.attributes.keyValuePairs !== 'object') {
        throw new AppError('Invalid attributes format: keyValuePairs must be an object', 400);
      }
      if (data.attributes.tags && !Array.isArray(data.attributes.tags)) {
        throw new AppError('Invalid attributes format: tags must be an array', 400);
      }
    }

    const category = await prisma.serviceCategory.findFirst({
      where: { id: data.categoryId, companyId: data.companyId },
    });
    if (!category) throw new AppError('Service category not found', 404);

    const createData: Record<string, unknown> = {
      companyId: data.companyId,
      categoryId: data.categoryId,
      title: data.title,
      details: data.details,
      pricing: data.pricing,
      useDeliveryDate: useDelivery,
      currency: data.currency || 'BDT',
      attributes: data.attributes || { keyValuePairs: {}, tags: [] },
    };
    if (useDelivery) {
      createData.deliveryStartDate = data.deliveryStartDate;
      createData.deliveryEndDate = data.deliveryEndDate;
      createData.durationDays = null;
    } else {
      createData.durationDays = data.durationDays;
      createData.deliveryStartDate = null;
      createData.deliveryEndDate = null;
    }

    const service = await prisma.service.create({
      data: createData as any,
    });
    return service;
  },

  /**
   * Get all services
   */
  async getAllServices(companyId: number, filters?: { isActive?: boolean }) {
    return await prisma.service.findMany({
      where: {
        companyId,
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
      include: {
        category: { select: { id: true, name: true, iconName: true, iconUrl: true } },
        _count: { select: { projects: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get service by ID
   */
  async getServiceById(id: number, companyId: number) {
    const service = await prisma.service.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        category: { select: { id: true, name: true, iconName: true, iconUrl: true } },
        projects: {
          select: { id: true, title: true, status: true, createdAt: true },
        },
        _count: { select: { projects: true } },
      },
    });

    if (!service) {
      throw new AppError('Service not found', 404);
    }

    return service;
  },

  /**
   * Update service
   */
  async updateService(id: number, companyId: number, data: UpdateServiceData) {
    const service = await prisma.service.findFirst({
      where: { id, companyId },
    });
    if (!service) throw new AppError('Service not found', 404);

    const useDelivery = data.useDeliveryDate ?? service.useDeliveryDate;
    if (useDelivery && data.deliveryStartDate && data.deliveryEndDate) {
      if (data.deliveryStartDate >= data.deliveryEndDate) {
        throw new AppError('Delivery end date must be after start date', 400);
      }
    } else if (!useDelivery && data.durationDays !== undefined && data.durationDays !== null && data.durationDays < 1) {
      throw new AppError('Duration (days) must be at least 1 when delivery date is disabled', 400);
    }

    if (data.attributes) {
      if (data.attributes.keyValuePairs && typeof data.attributes.keyValuePairs !== 'object') {
        throw new AppError('Invalid attributes format: keyValuePairs must be an object', 400);
      }
      if (data.attributes.tags && !Array.isArray(data.attributes.tags)) {
        throw new AppError('Invalid attributes format: tags must be an array', 400);
      }
    }

    if (data.categoryId !== undefined) {
      const category = await prisma.serviceCategory.findFirst({
        where: { id: data.categoryId, companyId },
      });
      if (!category) throw new AppError('Service category not found', 404);
    }

    const updateData: Record<string, unknown> = {
      categoryId: data.categoryId,
      title: data.title,
      details: data.details,
      pricing: data.pricing,
      useDeliveryDate: useDelivery,
      currency: data.currency,
      attributes: data.attributes,
      isActive: data.isActive,
    };
    if (useDelivery) {
      updateData.deliveryStartDate = data.deliveryStartDate ?? service.deliveryStartDate;
      updateData.deliveryEndDate = data.deliveryEndDate ?? service.deliveryEndDate;
      updateData.durationDays = null;
    } else if (data.durationDays !== undefined) {
      updateData.durationDays = data.durationDays;
      updateData.deliveryStartDate = null;
      updateData.deliveryEndDate = null;
    }

    const updatedService = await prisma.service.update({
      where: { id },
      data: Object.fromEntries(Object.entries(updateData).filter(([, v]) => v !== undefined)) as any,
    });
    return updatedService;
  },

  /**
   * Delete service (soft delete if has projects, hard delete otherwise)
   */
  async deleteService(id: number, companyId: number) {
    const service = await prisma.service.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!service) {
      throw new AppError('Service not found', 404);
    }

    // If service has projects, soft delete (set isActive=false)
    if (service._count.projects > 0) {
      return await prisma.service.update({
        where: { id },
        data: { isActive: false },
      });
    }

    // Otherwise, hard delete
    return await prisma.service.delete({
      where: { id },
    });
  },
};

