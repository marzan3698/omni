import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
export const projectService = {
    /**
     * Get all projects for a client
     */
    async getClientProjects(clientId) {
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
        }
        catch (error) {
            console.error('Error fetching projects:', error);
            throw new AppError('Failed to fetch projects', 500);
        }
    },
    /**
     * Get all projects (for SuperAdmin or filtered by company)
     */
    async getAllProjects(companyId) {
        try {
            const where = {};
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
        }
        catch (error) {
            console.error('Error fetching all projects:', error);
            throw new AppError('Failed to fetch projects', 500);
        }
    },
    /**
     * Get project by ID
     */
    async getProjectById(id, clientId) {
        const project = await prisma.project.findFirst({
            where: {
                id,
                clientId,
            },
            include: {
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
    async createProject(data) {
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
                throw new AppError(`Budget must be between ${minBudget.toFixed(2)} and ${maxBudget.toFixed(2)} (50% to 150% of service price)`, 400);
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
        }
        catch (error) {
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
    async updateProject(id, clientId, data) {
        // Verify project belongs to client
        const project = await this.getProjectById(id, clientId);
        try {
            const updatedProject = await prisma.project.update({
                where: { id },
                data,
            });
            return updatedProject;
        }
        catch (error) {
            console.error('Error updating project:', error);
            throw new AppError('Failed to update project', 500);
        }
    },
    /**
     * Sign project (submit e-signature)
     */
    async signProject(id, clientId, data) {
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
        }
        catch (error) {
            console.error('Error signing project:', error);
            throw new AppError('Failed to sign project', 500);
        }
    },
    /**
     * Update project status (admin only)
     */
    async updateProjectStatus(id, status) {
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
        }
        catch (error) {
            console.error('Error updating project status:', error);
            throw new AppError('Failed to update project status', 500);
        }
    },
    /**
     * Get project statistics for a client
     */
    async getClientProjectStats(clientId) {
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
        }
        catch (error) {
            console.error('Error fetching project stats:', error);
            throw new AppError('Failed to fetch project statistics', 500);
        }
    },
};
//# sourceMappingURL=project.service.js.map