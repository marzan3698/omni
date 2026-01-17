import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { Prisma } from '@prisma/client';
export const campaignService = {
    /**
     * Get all campaigns for a company
     */
    async getAllCampaigns(companyId, filters) {
        const where = { companyId };
        if (filters?.type) {
            where.type = filters.type;
        }
        if (filters?.active !== undefined) {
            const now = new Date();
            if (filters.active) {
                // Active campaigns: startDate <= now <= endDate
                where.startDate = { lte: now };
                where.endDate = { gte: now };
            }
            else {
                // Inactive campaigns: either not started or ended
                where.OR = [
                    { startDate: { gt: now } },
                    { endDate: { lt: now } },
                ];
            }
        }
        try {
            const campaigns = await prisma.campaign.findMany({
                where,
                orderBy: { createdAt: 'desc' },
            });
            return campaigns;
        }
        catch (error) {
            console.error('Error fetching campaigns:', error);
            throw new AppError('Failed to fetch campaigns', 500);
        }
    },
    /**
     * Get campaign by ID
     */
    async getCampaignById(id, companyId) {
        const campaign = await prisma.campaign.findFirst({
            where: {
                id,
                companyId,
            },
            include: {
                products: {
                    include: {
                        product: {
                            include: {
                                category: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                leads: {
                    include: {
                        createdByUser: {
                            select: {
                                id: true,
                                email: true,
                            },
                        },
                        assignedEmployee: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                    },
                },
                groups: {
                    include: {
                        group: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                            },
                        },
                    },
                },
                project: {
                    select: {
                        id: true,
                        title: true,
                        clientId: true,
                        client: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                            },
                        },
                    },
                },
                clients: {
                    include: {
                        client: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                            },
                        },
                    },
                },
                invoices: {
                    include: {
                        invoice: {
                            select: {
                                id: true,
                                invoiceNumber: true,
                                totalAmount: true,
                                status: true,
                            },
                        },
                    },
                },
            },
        });
        if (!campaign) {
            throw new AppError('Campaign not found', 404);
        }
        return campaign;
    },
    /**
     * Create campaign
     */
    async createCampaign(data) {
        // Validate dates
        if (new Date(data.startDate) >= new Date(data.endDate)) {
            throw new AppError('End date must be after start date', 400);
        }
        // Validate budget
        if (data.budget <= 0) {
            throw new AppError('Budget must be greater than 0', 400);
        }
        // Verify company exists
        const company = await prisma.company.findFirst({
            where: { id: data.companyId },
        });
        if (!company) {
            throw new AppError('Company not found', 404);
        }
        // Verify project exists and get clientId from project
        const project = await prisma.project.findFirst({
            where: {
                id: data.projectId,
                companyId: data.companyId,
            },
            include: {
                invoices: true,
            },
        });
        if (!project) {
            throw new AppError('Project not found or does not belong to your company', 404);
        }
        // Create campaign
        const campaign = await prisma.campaign.create({
            data: {
                companyId: data.companyId,
                projectId: data.projectId,
                name: data.name,
                description: data.description && data.description.trim() ? data.description.trim() : null,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                budget: new Prisma.Decimal(data.budget),
                type: data.type,
            },
        });
        // Auto-assign client from project
        await prisma.campaignClient.create({
            data: {
                campaignId: campaign.id,
                clientId: project.clientId,
            },
        }).catch(() => {
            // Ignore if already exists
        });
        // Auto-assign invoices from project
        if (project.invoices && project.invoices.length > 0) {
            await prisma.campaignInvoice.createMany({
                data: project.invoices.map((invoice) => ({
                    campaignId: campaign.id,
                    invoiceId: invoice.id,
                })),
                skipDuplicates: true,
            });
        }
        // Assign products if provided
        if (data.productIds && data.productIds.length > 0) {
            // Validate products belong to the same company
            const products = await prisma.product.findMany({
                where: {
                    id: { in: data.productIds },
                    companyId: data.companyId,
                },
            });
            if (products.length !== data.productIds.length) {
                throw new AppError('Some products not found or do not belong to your company', 400);
            }
            // Create campaign-product relationships
            await prisma.campaignProduct.createMany({
                data: data.productIds.map((productId) => ({
                    campaignId: campaign.id,
                    productId,
                })),
                skipDuplicates: true,
            });
        }
        // Assign employee groups if provided
        if (data.groupIds && data.groupIds.length > 0) {
            // Validate groups belong to the same company
            const groups = await prisma.employeeGroup.findMany({
                where: {
                    id: { in: data.groupIds },
                    companyId: data.companyId,
                },
            });
            if (groups.length !== data.groupIds.length) {
                throw new AppError('Some employee groups not found or do not belong to your company', 400);
            }
            // Create campaign-group relationships
            await prisma.campaignGroup.createMany({
                data: data.groupIds.map((groupId) => ({
                    campaignId: campaign.id,
                    groupId,
                })),
                skipDuplicates: true,
            });
        }
        // Return campaign with project, products, clients (auto-assigned from project), invoices (auto-assigned from project), and leads
        return await prisma.campaign.findUnique({
            where: { id: campaign.id },
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                        clientId: true,
                        client: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                            },
                        },
                    },
                },
                products: {
                    include: {
                        product: {
                            include: {
                                category: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                clients: {
                    include: {
                        client: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                            },
                        },
                    },
                },
                invoices: {
                    include: {
                        invoice: {
                            select: {
                                id: true,
                                invoiceNumber: true,
                                totalAmount: true,
                                status: true,
                            },
                        },
                    },
                },
                leads: {
                    select: {
                        id: true,
                        value: true,
                    },
                },
                groups: {
                    include: {
                        group: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                            },
                        },
                    },
                },
            },
        });
    },
    /**
     * Update campaign
     */
    async updateCampaign(id, companyId, data) {
        const campaign = await prisma.campaign.findFirst({
            where: {
                id,
                companyId,
            },
        });
        if (!campaign) {
            throw new AppError('Campaign not found', 404);
        }
        // Validate dates if both are being updated
        if (data.startDate && data.endDate) {
            if (new Date(data.startDate) >= new Date(data.endDate)) {
                throw new AppError('End date must be after start date', 400);
            }
        }
        else if (data.startDate) {
            const endDate = campaign.endDate;
            if (new Date(data.startDate) >= endDate) {
                throw new AppError('End date must be after start date', 400);
            }
        }
        else if (data.endDate) {
            const startDate = campaign.startDate;
            if (startDate >= new Date(data.endDate)) {
                throw new AppError('End date must be after start date', 400);
            }
        }
        // Validate budget
        if (data.budget !== undefined && data.budget <= 0) {
            throw new AppError('Budget must be greater than 0', 400);
        }
        // If projectId is being updated, verify the new project and update client/invoices
        if (data.projectId !== undefined && data.projectId !== campaign.projectId) {
            const project = await prisma.project.findFirst({
                where: {
                    id: data.projectId,
                    companyId: companyId,
                },
                include: {
                    invoices: true,
                },
            });
            if (!project) {
                throw new AppError('Project not found or does not belong to your company', 404);
            }
            // Update projectId
            updateData.projectId = data.projectId;
            // Update client assignment (remove old, add new)
            await prisma.campaignClient.deleteMany({
                where: { campaignId: id },
            });
            await prisma.campaignClient.create({
                data: {
                    campaignId: id,
                    clientId: project.clientId,
                },
            });
            // Update invoice assignments (remove old, add new)
            await prisma.campaignInvoice.deleteMany({
                where: { campaignId: id },
            });
            if (project.invoices && project.invoices.length > 0) {
                await prisma.campaignInvoice.createMany({
                    data: project.invoices.map((invoice) => ({
                        campaignId: id,
                        invoiceId: invoice.id,
                    })),
                    skipDuplicates: true,
                });
            }
        }
        const updateData = {};
        if (data.projectId !== undefined)
            updateData.projectId = data.projectId;
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.description !== undefined) {
            updateData.description = data.description && data.description.trim() ? data.description.trim() : null;
        }
        if (data.startDate !== undefined)
            updateData.startDate = new Date(data.startDate);
        if (data.endDate !== undefined)
            updateData.endDate = new Date(data.endDate);
        if (data.budget !== undefined)
            updateData.budget = new Prisma.Decimal(data.budget);
        if (data.type !== undefined)
            updateData.type = data.type;
        if (data.isActive !== undefined)
            updateData.isActive = data.isActive;
        // Update campaign
        const updatedCampaign = await prisma.campaign.update({
            where: { id },
            data: updateData,
        });
        // Update products if provided
        if (data.productIds !== undefined) {
            // Delete existing product assignments
            await prisma.campaignProduct.deleteMany({
                where: { campaignId: id },
            });
            // Add new product assignments if any
            if (data.productIds.length > 0) {
                // Validate products belong to the same company
                const products = await prisma.product.findMany({
                    where: {
                        id: { in: data.productIds },
                        companyId,
                    },
                });
                if (products.length !== data.productIds.length) {
                    throw new AppError('Some products not found or do not belong to your company', 400);
                }
                // Create campaign-product relationships
                await prisma.campaignProduct.createMany({
                    data: data.productIds.map((productId) => ({
                        campaignId: id,
                        productId,
                    })),
                    skipDuplicates: true,
                });
            }
        }
        // Update employee groups if provided
        if (data.groupIds !== undefined) {
            // Delete existing group assignments
            await prisma.campaignGroup.deleteMany({
                where: { campaignId: id },
            });
            // Add new group assignments if any
            if (data.groupIds.length > 0) {
                // Validate groups belong to the same company
                const groups = await prisma.employeeGroup.findMany({
                    where: {
                        id: { in: data.groupIds },
                        companyId,
                    },
                });
                if (groups.length !== data.groupIds.length) {
                    throw new AppError('Some employee groups not found or do not belong to your company', 400);
                }
                // Create campaign-group relationships
                await prisma.campaignGroup.createMany({
                    data: data.groupIds.map((groupId) => ({
                        campaignId: id,
                        groupId,
                    })),
                    skipDuplicates: true,
                });
            }
        }
        // Return campaign with project, products, clients, invoices, and leads
        return await prisma.campaign.findUnique({
            where: { id },
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                        clientId: true,
                        client: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                            },
                        },
                    },
                },
                products: {
                    include: {
                        product: {
                            include: {
                                category: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                clients: {
                    include: {
                        client: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                            },
                        },
                    },
                },
                invoices: {
                    include: {
                        invoice: {
                            select: {
                                id: true,
                                invoiceNumber: true,
                                totalAmount: true,
                                status: true,
                            },
                        },
                    },
                },
                leads: {
                    select: {
                        id: true,
                        value: true,
                    },
                },
                groups: {
                    include: {
                        group: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                            },
                        },
                    },
                },
            },
        });
    },
    /**
     * Delete campaign
     */
    async deleteCampaign(id, companyId) {
        const campaign = await prisma.campaign.findFirst({
            where: {
                id,
                companyId,
            },
        });
        if (!campaign) {
            throw new AppError('Campaign not found', 404);
        }
        // Check if campaign has leads
        const leadCount = await prisma.lead.count({
            where: { campaignId: id },
        });
        if (leadCount > 0) {
            throw new AppError('Cannot delete campaign with associated leads. Please remove leads first.', 400);
        }
        return await prisma.campaign.delete({
            where: { id },
        });
    },
    /**
     * Get campaign statistics
     */
    async getCampaignStatistics(id, companyId) {
        const campaign = await prisma.campaign.findFirst({
            where: {
                id,
                companyId,
            },
            include: {
                leads: {
                    select: {
                        id: true,
                        value: true,
                        status: true,
                    },
                },
            },
        });
        if (!campaign) {
            throw new AppError('Campaign not found', 404);
        }
        const totalLeads = campaign.leads.length;
        const totalEstimatedValue = campaign.leads.reduce((sum, lead) => {
            return sum + (lead.value ? Number(lead.value) : 0);
        }, 0);
        const progressPercentage = Number(campaign.budget) > 0
            ? (totalEstimatedValue / Number(campaign.budget)) * 100
            : 0;
        const leadsByStatus = campaign.leads.reduce((acc, lead) => {
            const status = lead.status || 'Unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        return {
            campaign: {
                id: campaign.id,
                name: campaign.name,
                budget: Number(campaign.budget),
            },
            statistics: {
                totalLeads,
                totalEstimatedValue,
                progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
                budget: Number(campaign.budget),
                remainingBudget: Number(campaign.budget) - totalEstimatedValue,
                leadsByStatus,
            },
        };
    },
    /**
     * Get active campaigns (startDate <= now <= endDate)
     */
    async getActiveCampaigns(companyId) {
        const now = new Date();
        return await prisma.campaign.findMany({
            where: {
                companyId,
                startDate: { lte: now },
                endDate: { gte: now },
            },
            orderBy: { createdAt: 'desc' },
            include: {
                products: {
                    include: {
                        product: {
                            include: {
                                category: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                leads: {
                    select: {
                        id: true,
                        value: true,
                    },
                },
                clients: {
                    include: {
                        client: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                            },
                        },
                    },
                },
                groups: {
                    include: {
                        group: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                            },
                        },
                    },
                },
            },
        });
    },
    /**
     * Get campaign clients
     */
    async getCampaignClients(id, companyId) {
        const campaign = await prisma.campaign.findFirst({
            where: {
                id,
                companyId,
            },
        });
        if (!campaign) {
            throw new AppError('Campaign not found', 404);
        }
        const campaignClients = await prisma.campaignClient.findMany({
            where: { campaignId: id },
            include: {
                client: {
                    select: {
                        id: true,
                        email: true,
                        createdAt: true,
                    },
                },
            },
        });
        return campaignClients.map((cc) => cc.client);
    },
    /**
     * Get campaign products
     */
    async getCampaignProducts(campaignId, companyId) {
        // Verify campaign exists and belongs to company
        const campaign = await prisma.campaign.findFirst({
            where: {
                id: campaignId,
                companyId,
            },
        });
        if (!campaign) {
            throw new AppError('Campaign not found', 404);
        }
        // Get products assigned to this campaign
        const campaignProducts = await prisma.campaignProduct.findMany({
            where: {
                campaignId,
            },
            include: {
                product: {
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        return campaignProducts.map((cp) => cp.product);
    },
    /**
     * Get campaign groups (employee groups assigned to campaign)
     */
    async getCampaignGroups(campaignId, companyId) {
        // Verify campaign exists and belongs to company
        const campaign = await prisma.campaign.findFirst({
            where: {
                id: campaignId,
                companyId,
            },
        });
        if (!campaign) {
            throw new AppError('Campaign not found', 404);
        }
        // Get groups assigned to this campaign
        const campaignGroups = await prisma.campaignGroup.findMany({
            where: {
                campaignId,
            },
            include: {
                group: {
                    include: {
                        members: {
                            include: {
                                employee: {
                                    include: {
                                        user: {
                                            select: {
                                                id: true,
                                                name: true,
                                                email: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        return campaignGroups.map((cg) => cg.group);
    },
    /**
     * Get campaigns for a specific client
     */
    async getClientCampaigns(clientId, companyId) {
        try {
            // Find all campaigns where this client is assigned
            const campaignClients = await prisma.campaignClient.findMany({
                where: {
                    clientId,
                    campaign: {
                        companyId,
                    },
                },
                include: {
                    campaign: {
                        include: {
                            project: {
                                select: {
                                    id: true,
                                    title: true,
                                    status: true,
                                },
                            },
                            products: {
                                include: {
                                    product: {
                                        include: {
                                            category: {
                                                select: {
                                                    id: true,
                                                    name: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            leads: {
                                select: {
                                    id: true,
                                    title: true,
                                    status: true,
                                    value: true,
                                },
                            },
                            invoices: {
                                include: {
                                    invoice: {
                                        select: {
                                            id: true,
                                            invoiceNumber: true,
                                            totalAmount: true,
                                            status: true,
                                        },
                                    },
                                },
                            },
                            groups: {
                                include: {
                                    group: {
                                        select: {
                                            id: true,
                                            name: true,
                                            description: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    campaign: {
                        createdAt: 'desc',
                    },
                },
            });
            // Return only the campaigns
            return campaignClients.map((cc) => cc.campaign);
        }
        catch (error) {
            console.error('Error fetching client campaigns:', error);
            throw new AppError('Failed to fetch client campaigns', 500);
        }
    },
};
//# sourceMappingURL=campaign.service.js.map