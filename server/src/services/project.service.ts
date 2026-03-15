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

interface CheckoutData {
  companyId: number;
  clientId: string;
  serviceIds: number[];
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
        include: {
          service: {
            select: {
              id: true,
              title: true,
              pricing: true,
            },
          },
          invoices: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              invoiceNumber: true,
              status: true,
              totalAmount: true,
              dueDate: true,
            },
          },
        },
      });
      return projects;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw new AppError('Failed to fetch projects', 500);
    }
  },

  /**
   * Get all projects (for SuperAdmin or filtered by company)
   */
  async getAllProjects(companyId?: number) {
    try {
      const where: any = {};
      if (companyId) {
        where.companyId = companyId;
      }

      const projects = await prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          service: {
            select: {
              id: true,
              title: true,
              pricing: true,
            },
          },
          client: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          invoices: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              invoiceNumber: true,
              status: true,
              totalAmount: true,
              dueDate: true,
            },
          },
        },
      });
      return projects;
    } catch (error) {
      console.error('Error fetching all projects:', error);
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
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
              companyName: true,
            },
          },
          service: {
            select: {
              id: true,
              title: true,
              pricing: true,
              attributes: true,
            },
          },
          invoices: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              invoiceNumber: true,
              status: true,
              totalAmount: true,
              dueDate: true,
              createdAt: true,
            },
          },
          payments: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              amount: true,
              status: true,
              paymentMethod: true,
              createdAt: true,
              paidAt: true,
              verifiedAt: true,
            },
          },
          tasks: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              priority: true,
              progress: true,
              dueDate: true,
              startedAt: true,
              createdAt: true,
            },
          },
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

      // Delivery dates fallback
      let deliveryStartDate: Date | undefined = data.deliveryStartDate;
      let deliveryEndDate: Date | undefined = data.deliveryEndDate;

      if (service.useDeliveryDate && service.deliveryStartDate && service.deliveryEndDate) {
        deliveryStartDate = deliveryStartDate || service.deliveryStartDate;
        deliveryEndDate = deliveryEndDate || service.deliveryEndDate;
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

  /**
   * Checkout multiple services and create projects
   */
  async checkout(data: CheckoutData) {
    const { companyId, clientId, serviceIds } = data;
    
    try {
      // Use a transaction for consistency
      return await prisma.$transaction(async (tx) => {
        const results = [];

        for (const serviceId of serviceIds) {
          const service = await tx.service.findFirst({
            where: { id: serviceId, companyId, isActive: true }
          });

          if (!service) continue;

          // Delivery dates fallback
          const start = service.deliveryStartDate || new Date();
          const end = service.deliveryEndDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

          const project = await tx.project.create({
            data: {
              companyId,
              clientId,
              serviceId,
              title: service.title,
              description: service.details,
              budget: service.pricing,
              deliveryStartDate: start,
              deliveryEndDate: end,
              time: `${days} days`,
              status: 'Submitted',
              signedAt: new Date(),
              signature: 'Ecommerce Checkout' // Placeholder for automated checkout
            }
          });

          results.push(project);
        }

        return results;
      });
    } catch (error: any) {
      console.error('Error during checkout:', error);
      throw new AppError(error.message || 'Failed to complete checkout', 500);
    }
  },

  /**
   * Get public project feed for tickers
   */
  async getPublicProjectFeed() {
    try {
      const projects = await prisma.project.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
              name: true,
              companyName: true,
            },
          },
          service: {
            select: {
              title: true,
            },
          },
        },
      });

      return projects.map((p) => ({
        id: p.id,
        clientName: p.client?.name || 'A Client',
        companyName: p.client?.companyName || 'Confidential',
        serviceTitle: p.service?.title || 'Premium Service',
        createdAt: p.createdAt,
      }));
    } catch (error) {
      console.error('Error fetching public project feed:', error);
      throw new AppError('Failed to fetch activity feed', 500);
    }
  }
};

