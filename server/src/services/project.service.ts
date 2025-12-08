import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { ProjectStatus } from '@prisma/client';

interface CreateProjectData {
  companyId: number;
  clientId: string;
  serviceId: number;
  title?: string;
  description?: string;
  budget: number;
  deliveryStartDate?: Date;
  deliveryEndDate?: Date;
  time: string;
}

interface UpdateProjectData {
  title?: string;
  description?: string;
  budget?: number;
  time?: string;
  status?: ProjectStatus;
}

interface SignProjectData {
  signature: string;
}

export const projectService = {
  /**
   * Get all projects for a client
   */
  async getClientProjects(clientId: string) {
    try {
      const projects = await prisma.project.findMany({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
      });
      return projects;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw new AppError('Failed to fetch projects', 500);
    }
  },

  /**
   * Get project by ID
   */
  async getProjectById(id: number, clientId: string) {
    const project = await prisma.project.findFirst({
      where: {
        id,
        clientId,
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    return project;
  },

  /**
   * Create a new project
   */
  async createProject(data: CreateProjectData) {
    try {
      // Get service to auto-populate title/description and validate
      const service = await prisma.service.findFirst({
        where: {
          id: data.serviceId,
          companyId: data.companyId,
          isActive: true,
        },
      });

      if (!service) {
        throw new AppError('Service not found or inactive', 404);
      }

      // Auto-populate title and description from service if not provided
      const title = data.title || service.title;
      const description = data.description || service.details;

      // Validate budget is within ±50% of service pricing
      const minBudget = Number(service.pricing) * 0.5;
      const maxBudget = Number(service.pricing) * 1.5;
      if (data.budget < minBudget || data.budget > maxBudget) {
        throw new AppError(
          `Budget must be between ${minBudget.toFixed(2)} and ${maxBudget.toFixed(2)} (50% to 150% of service price)`,
          400
        );
      }

      // Validate delivery dates are within service date range
      const deliveryStartDate = data.deliveryStartDate || service.deliveryStartDate;
      const deliveryEndDate = data.deliveryEndDate || service.deliveryEndDate;

      if (deliveryStartDate < service.deliveryStartDate || deliveryStartDate > service.deliveryEndDate) {
        throw new AppError('Delivery start date must be within service date range', 400);
      }

      if (deliveryEndDate < service.deliveryStartDate || deliveryEndDate > service.deliveryEndDate) {
        throw new AppError('Delivery end date must be within service date range', 400);
      }

      if (deliveryStartDate >= deliveryEndDate) {
        throw new AppError('Delivery end date must be after start date', 400);
      }

      const project = await prisma.project.create({
        data: {
          companyId: data.companyId,
          clientId: data.clientId,
          serviceId: data.serviceId,
          title,
          description,
          budget: data.budget,
          deliveryStartDate,
          deliveryEndDate,
          time: data.time,
          status: 'Draft',
        },
        include: {
          service: {
            select: {
              id: true,
              title: true,
              pricing: true,
            },
          },
        },
      });

      return project;
    } catch (error: any) {
      console.error('Error creating project:', error);
      if (error instanceof AppError) {
        throw error;
      }
      const errorMessage = error?.message || 'Failed to create project';
      throw new AppError(errorMessage, 500);
    }
  },

  /**
   * Update project
   */
  async updateProject(id: number, clientId: string, data: UpdateProjectData) {
    // Verify project belongs to client
    const project = await this.getProjectById(id, clientId);

    try {
      const updatedProject = await prisma.project.update({
        where: { id },
        data,
      });

      return updatedProject;
    } catch (error) {
      console.error('Error updating project:', error);
      throw new AppError('Failed to update project', 500);
    }
  },

  /**
   * Sign project (submit e-signature)
   */
  async signProject(id: number, clientId: string, data: SignProjectData) {
    // Verify project belongs to client
    const project = await this.getProjectById(id, clientId);

    if (project.status !== 'Draft') {
      throw new AppError('Project has already been submitted', 400);
    }

    try {
      const updatedProject = await prisma.project.update({
        where: { id },
        data: {
          signature: data.signature,
          signedAt: new Date(),
          status: 'Submitted',
        },
      });

      return updatedProject;
    } catch (error) {
      console.error('Error signing project:', error);
      throw new AppError('Failed to sign project', 500);
    }
  },

  /**
   * Update project status (admin only)
   */
  async updateProjectStatus(id: number, status: ProjectStatus) {
    try {
      const project = await prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      const updatedProject = await prisma.project.update({
        where: { id },
        data: { status },
      });

      return updatedProject;
    } catch (error) {
      console.error('Error updating project status:', error);
      throw new AppError('Failed to update project status', 500);
    }
  },

  /**
   * Get project statistics for a client
   */
  async getClientProjectStats(clientId: string) {
    try {
      const [total, active, completed] = await Promise.all([
        prisma.project.count({
          where: { clientId },
        }),
        prisma.project.count({
          where: {
            clientId,
            status: { in: ['Draft', 'Submitted', 'InProgress'] },
          },
        }),
        prisma.project.count({
          where: {
            clientId,
            status: 'Completed',
          },
        }),
      ]);

      return {
        total,
        active,
        completed,
      };
    } catch (error) {
      console.error('Error fetching project stats:', error);
      throw new AppError('Failed to fetch project statistics', 500);
    }
  },
};

