import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { ProjectStatus } from '@prisma/client';

interface UpdateProjectData {
  title?: string;
  description?: string;
  budget?: number;
  deliveryStartDate?: Date;
  deliveryEndDate?: Date;
  time?: string;
  status?: ProjectStatus;
}

interface UpdateClientData {
  name?: string;
  contactInfo?: any;
  address?: string;
}

export const adminService = {
  /**
   * Get all projects across all companies (SuperAdmin only)
   */
  async getAllProjects(filters?: {
    companyId?: number;
    status?: ProjectStatus;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    return await prisma.project.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            email: true,
          },
        },
        service: {
          select: {
            id: true,
            title: true,
            pricing: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get all clients across all companies (SuperAdmin only)
   */
  async getAllClients(filters?: {
    companyId?: number;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters?.search) {
      // Simple name search - JSON search is complex, so we'll search by name
      where.name = { contains: filters.search };
    }

    return await prisma.client.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            invoices: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Update project (SuperAdmin/Admin)
   */
  async updateProject(id: number, data: UpdateProjectData) {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        budget: data.budget,
        deliveryStartDate: data.deliveryStartDate,
        deliveryEndDate: data.deliveryEndDate,
        time: data.time,
        status: data.status,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            email: true,
          },
        },
        service: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return updatedProject;
  },

  /**
   * Delete project (SuperAdmin/Admin)
   */
  async deleteProject(id: number) {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    return await prisma.project.delete({
      where: { id },
    });
  },

  /**
   * Update client (SuperAdmin/Admin)
   */
  async updateClient(id: number, data: UpdateClientData) {
    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name: data.name,
        contactInfo: data.contactInfo,
        address: data.address,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            invoices: true,
          },
        },
      },
    });

    return updatedClient;
  },

  /**
   * Delete client (SuperAdmin/Admin)
   */
  async deleteClient(id: number) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            invoices: true,
          },
        },
      },
    });

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    // Check if client has invoices
    if (client._count.invoices > 0) {
      throw new AppError('Cannot delete client with existing invoices', 400);
    }

    return await prisma.client.delete({
      where: { id },
    });
  },
};

