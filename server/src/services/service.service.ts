import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

import { PriceType, RenewalInterval, ThumbnailType } from '@prisma/client';

interface ServiceAttributes {
  keyValuePairs?: { [key: string]: string };
  tags?: string[];
}

interface CreateServiceData {
  companyId: number;
  categoryId: number;
  title: string;
  shortDescription?: string;
  details: string;
  priceType: PriceType;
  pricing: number;
  renewalInterval?: RenewalInterval;
  thumbnailType: ThumbnailType;
  thumbnailUrl?: string;
  gallery?: string[];
  attributes: ServiceAttributes;
  currency?: string;
  isActive?: boolean;
}

interface UpdateServiceData {
  categoryId?: number;
  title?: string;
  shortDescription?: string;
  details?: string;
  priceType?: PriceType;
  pricing?: number;
  renewalInterval?: RenewalInterval | null;
  thumbnailType?: ThumbnailType;
  thumbnailUrl?: string;
  gallery?: string[];
  attributes?: ServiceAttributes;
  isActive?: boolean;
  currency?: string;
}

export const serviceService = {
  /**
   * Create a new service
   */
  async createService(data: CreateServiceData) {
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

    const service = await prisma.service.create({
      data: {
        companyId: data.companyId,
        categoryId: data.categoryId,
        title: data.title,
        shortDescription: data.shortDescription,
        details: data.details,
        priceType: data.priceType,
        pricing: data.pricing,
        renewalInterval: data.renewalInterval,
        thumbnailType: data.thumbnailType,
        thumbnailUrl: data.thumbnailUrl,
        gallery: data.gallery || [],
        currency: data.currency || 'BDT',
        attributes: (data.attributes as any) || { keyValuePairs: {}, tags: [] },
        isActive: data.isActive !== false,
        // Legacy fields set to defaults/optional
        useDeliveryDate: false,
      },
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
        category: { select: { id: true, name: true, iconName: true, iconUrl: true, parentId: true } },
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
        category: { select: { id: true, name: true, iconName: true, iconUrl: true, parentId: true } },
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

    const updateData: any = {
      categoryId: data.categoryId,
      title: data.title,
      shortDescription: data.shortDescription,
      details: data.details,
      priceType: data.priceType,
      pricing: data.pricing,
      renewalInterval: data.renewalInterval,
      thumbnailType: data.thumbnailType,
      thumbnailUrl: data.thumbnailUrl,
      gallery: data.gallery,
      currency: data.currency,
      attributes: data.attributes,
      isActive: data.isActive,
    };

    const updatedService = await prisma.service.update({
      where: { id },
      data: Object.fromEntries(Object.entries(updateData).filter(([, v]) => v !== undefined)),
    });
    return updatedService;
  },

  /**
   * Delete service
   */
  async deleteService(id: number, companyId: number) {
    const service = await prisma.service.findFirst({
      where: { id, companyId },
      include: { _count: { select: { projects: true } } },
    });

    if (!service) throw new AppError('Service not found', 404);

    if (service._count.projects > 0) {
      return await prisma.service.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return await prisma.service.delete({ where: { id } });
  },
};

