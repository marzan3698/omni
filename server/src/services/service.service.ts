import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

interface ServiceAttributes {
  keyValuePairs?: { [key: string]: string };
  tags?: string[];
}

interface CreateServiceData {
  companyId: number;
  title: string;
  details: string;
  pricing: number;
  deliveryStartDate: Date;
  deliveryEndDate: Date;
  attributes: ServiceAttributes;
}

interface UpdateServiceData {
  title?: string;
  details?: string;
  pricing?: number;
  deliveryStartDate?: Date;
  deliveryEndDate?: Date;
  attributes?: ServiceAttributes;
  isActive?: boolean;
}

export const serviceService = {
  /**
   * Create a new service
   */
  async createService(data: CreateServiceData) {
    // Validate date range
    if (data.deliveryStartDate >= data.deliveryEndDate) {
      throw new AppError('Delivery end date must be after start date', 400);
    }

    // Validate attributes structure
    if (data.attributes) {
      if (data.attributes.keyValuePairs && typeof data.attributes.keyValuePairs !== 'object') {
        throw new AppError('Invalid attributes format: keyValuePairs must be an object', 400);
      }
      if (data.attributes.tags && !Array.isArray(data.attributes.tags)) {
        throw new AppError('Invalid attributes format: tags must be an array', 400);
      }
    }

    const service = await prisma.service.create({
      data: {
        companyId: data.companyId,
        title: data.title,
        details: data.details,
        pricing: data.pricing,
        deliveryStartDate: data.deliveryStartDate,
        deliveryEndDate: data.deliveryEndDate,
        attributes: data.attributes || { keyValuePairs: {}, tags: [] },
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
        _count: {
          select: {
            projects: true,
          },
        },
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
        projects: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
        },
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

    return service;
  },

  /**
   * Update service
   */
  async updateService(id: number, companyId: number, data: UpdateServiceData) {
    const service = await prisma.service.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!service) {
      throw new AppError('Service not found', 404);
    }

    // Validate date range if both dates are being updated
    if (data.deliveryStartDate && data.deliveryEndDate) {
      if (data.deliveryStartDate >= data.deliveryEndDate) {
        throw new AppError('Delivery end date must be after start date', 400);
      }
    } else if (data.deliveryStartDate) {
      if (data.deliveryStartDate >= service.deliveryEndDate) {
        throw new AppError('Delivery start date must be before end date', 400);
      }
    } else if (data.deliveryEndDate) {
      if (service.deliveryStartDate >= data.deliveryEndDate) {
        throw new AppError('Delivery end date must be after start date', 400);
      }
    }

    // Validate attributes structure
    if (data.attributes) {
      if (data.attributes.keyValuePairs && typeof data.attributes.keyValuePairs !== 'object') {
        throw new AppError('Invalid attributes format: keyValuePairs must be an object', 400);
      }
      if (data.attributes.tags && !Array.isArray(data.attributes.tags)) {
        throw new AppError('Invalid attributes format: tags must be an array', 400);
      }
    }

    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        title: data.title,
        details: data.details,
        pricing: data.pricing,
        deliveryStartDate: data.deliveryStartDate,
        deliveryEndDate: data.deliveryEndDate,
        attributes: data.attributes,
        isActive: data.isActive,
      },
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

