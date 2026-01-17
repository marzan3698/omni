import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { Prisma } from '@prisma/client';
export const leadService = {
    /**
     * Get all leads (optionally filtered by user who created them)
     */
    async getAllLeads(filters) {
        const where = {};
        if (filters?.createdBy) {
            where.createdBy = filters.createdBy;
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.source) {
            where.source = filters.source;
        }
        if (filters?.assignedTo) {
            where.assignedTo = filters.assignedTo;
        }
        if (filters?.categoryId) {
            where.categoryId = filters.categoryId;
        }
        if (filters?.interestId) {
            where.interestId = filters.interestId;
        }
        if (filters?.search) {
            const searchTerm = filters.search.toLowerCase();
            where.OR = [
                { title: { contains: filters.search } },
                { customerName: { contains: filters.search } },
                { phone: { contains: filters.search } },
                { description: { contains: filters.search } },
            ];
        }
        return await prisma.lead.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                createdByUser: {
                    select: {
                        id: true,
                        email: true,
                        profileImage: true,
                    },
                },
                assignedEmployee: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                profileImage: true,
                            },
                        },
                    },
                },
                conversation: {
                    select: {
                        id: true,
                        externalUserName: true,
                        platform: true,
                        lastMessageAt: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                interest: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                campaign: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
                product: {
                    select: {
                        id: true,
                        name: true,
                        purchasePrice: true,
                        salePrice: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    },
    /**
     * Get lead by ID
     */
    async getLeadById(id, companyId) {
        const lead = await prisma.lead.findFirst({
            where: {
                id,
                companyId,
            },
            include: {
                assignedEmployee: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                profileImage: true,
                                role: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                conversation: {
                    include: {
                        messages: {
                            take: 10,
                            orderBy: { createdAt: 'desc' },
                        },
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                interest: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                campaign: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        description: true,
                        startDate: true,
                        endDate: true,
                        budget: true,
                    },
                },
                product: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        purchasePrice: true,
                        salePrice: true,
                        currency: true,
                        imageUrl: true,
                        productCompany: true,
                    },
                },
                createdByUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        profileImage: true,
                        role: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        if (!lead) {
            throw new AppError('Lead not found', 404);
        }
        return lead;
    },
    /**
     * Create lead from inbox conversation
     */
    async createLeadFromInbox(conversationId, userId, data) {
        // Verify conversation exists
        const conversation = await prisma.socialConversation.findFirst({
            where: {
                id: conversationId,
            },
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!conversation) {
            throw new AppError('Conversation not found', 404);
        }
        // Check if lead already exists for this conversation
        const existingLead = await prisma.lead.findFirst({
            where: {
                conversationId,
            },
        });
        if (existingLead) {
            throw new AppError('Lead already exists for this conversation', 400);
        }
        // Verify assigned employee if provided
        if (data.assignedTo) {
            const employee = await prisma.employee.findFirst({
                where: {
                    id: data.assignedTo,
                },
            });
            if (!employee) {
                throw new AppError('Employee not found', 404);
            }
        }
        // Verify category (required)
        if (!data.categoryId || data.categoryId <= 0) {
            throw new AppError('Lead category is required', 400);
        }
        const category = await prisma.leadCategory.findFirst({
            where: {
                id: data.categoryId,
            },
        });
        if (!category) {
            throw new AppError('Lead category not found', 404);
        }
        // Verify interest (required)
        if (!data.interestId || data.interestId <= 0) {
            throw new AppError('Lead interest is required', 400);
        }
        const interest = await prisma.leadInterest.findFirst({
            where: {
                id: data.interestId,
            },
        });
        if (!interest) {
            throw new AppError('Lead interest not found', 404);
        }
        // Verify campaign (required)
        if (!data.campaignId || data.campaignId <= 0) {
            throw new AppError('Campaign is required', 400);
        }
        const campaign = await prisma.campaign.findFirst({
            where: {
                id: data.campaignId,
            },
            include: {
                company: {
                    select: {
                        id: true,
                    },
                },
            },
        });
        if (!campaign) {
            throw new AppError('Campaign not found', 404);
        }
        // Verify campaign is active (startDate <= now <= endDate)
        const now = new Date();
        if (campaign.startDate > now || campaign.endDate < now) {
            throw new AppError('Campaign is not active', 400);
        }
        // Verify product if provided
        if (data.productId) {
            const product = await prisma.product.findFirst({
                where: {
                    id: data.productId,
                },
            });
            if (!product) {
                throw new AppError('Product not found', 404);
            }
        }
        // Calculate profit if purchasePrice and salePrice are provided
        let calculatedProfit = null;
        if (data.purchasePrice !== undefined && data.salePrice !== undefined &&
            data.purchasePrice !== null && data.salePrice !== null) {
            calculatedProfit = new Prisma.Decimal(data.salePrice).minus(new Prisma.Decimal(data.purchasePrice));
        }
        else if (data.profit !== undefined && data.profit !== null) {
            // Use provided profit if calculation wasn't possible
            calculatedProfit = new Prisma.Decimal(data.profit);
        }
        // Create lead
        return await prisma.lead.create({
            data: {
                companyId: conversation.companyId,
                createdBy: userId,
                title: data.title,
                description: data.description || null,
                source: 'Inbox',
                status: 'New',
                assignedTo: data.assignedTo || null,
                value: data.value !== undefined && data.value !== null ? new Prisma.Decimal(data.value) : null,
                conversationId,
                customerName: data.customerName || null,
                phone: data.phone || null,
                categoryId: data.categoryId,
                interestId: data.interestId,
                campaignId: data.campaignId,
                productId: data.productId || null,
                purchasePrice: data.purchasePrice !== undefined && data.purchasePrice !== null ? new Prisma.Decimal(data.purchasePrice) : null,
                salePrice: data.salePrice !== undefined && data.salePrice !== null ? new Prisma.Decimal(data.salePrice) : null,
                profit: calculatedProfit,
            },
            include: {
                createdByUser: {
                    select: {
                        id: true,
                        email: true,
                        profileImage: true,
                    },
                },
                assignedEmployee: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                profileImage: true,
                            },
                        },
                    },
                },
                conversation: {
                    select: {
                        id: true,
                        externalUserName: true,
                        platform: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                interest: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                campaign: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
            },
        });
    },
    /**
     * Create lead
     */
    async createLead(data) {
        // Verify assigned employee if provided
        if (data.assignedTo) {
            const employee = await prisma.employee.findFirst({
                where: {
                    id: data.assignedTo,
                    companyId: data.companyId,
                },
            });
            if (!employee) {
                throw new AppError('Employee not found', 404);
            }
        }
        // Verify conversation if provided
        if (data.conversationId) {
            const conversation = await prisma.socialConversation.findFirst({
                where: {
                    id: data.conversationId,
                    companyId: data.companyId,
                },
            });
            if (!conversation) {
                throw new AppError('Conversation not found', 404);
            }
        }
        // Verify category if provided
        if (data.categoryId) {
            const category = await prisma.leadCategory.findFirst({
                where: {
                    id: data.categoryId,
                    companyId: data.companyId,
                },
            });
            if (!category) {
                throw new AppError('Lead category not found', 404);
            }
        }
        // Verify interest if provided
        if (data.interestId) {
            const interest = await prisma.leadInterest.findFirst({
                where: {
                    id: data.interestId,
                    companyId: data.companyId,
                },
            });
            if (!interest) {
                throw new AppError('Lead interest not found', 404);
            }
        }
        // Verify campaign if provided
        if (data.campaignId) {
            const campaign = await prisma.campaign.findFirst({
                where: {
                    id: data.campaignId,
                    companyId: data.companyId,
                },
            });
            if (!campaign) {
                throw new AppError('Campaign not found', 404);
            }
            // Verify campaign is active (startDate <= now <= endDate)
            const now = new Date();
            if (campaign.startDate > now || campaign.endDate < now) {
                throw new AppError('Campaign is not active', 400);
            }
        }
        // Verify product if provided
        if (data.productId) {
            const product = await prisma.product.findFirst({
                where: {
                    id: data.productId,
                    companyId: data.companyId,
                },
            });
            if (!product) {
                throw new AppError('Product not found', 404);
            }
        }
        // Calculate profit if purchasePrice and salePrice are provided
        let calculatedProfit = null;
        if (data.purchasePrice !== undefined && data.salePrice !== undefined &&
            data.purchasePrice !== null && data.salePrice !== null) {
            calculatedProfit = new Prisma.Decimal(data.salePrice).minus(new Prisma.Decimal(data.purchasePrice));
        }
        else if (data.profit !== undefined && data.profit !== null) {
            // Use provided profit if calculation wasn't possible
            calculatedProfit = new Prisma.Decimal(data.profit);
        }
        return await prisma.lead.create({
            data: {
                createdBy: data.createdBy,
                title: data.title,
                description: data.description,
                source: data.source,
                status: data.status || 'New',
                assignedTo: data.assignedTo,
                value: data.value,
                conversationId: data.conversationId,
                customerName: data.customerName,
                phone: data.phone,
                categoryId: data.categoryId,
                interestId: data.interestId,
                campaignId: data.campaignId || null,
                productId: data.productId || null,
                purchasePrice: data.purchasePrice !== undefined && data.purchasePrice !== null ? new Prisma.Decimal(data.purchasePrice) : null,
                salePrice: data.salePrice !== undefined && data.salePrice !== null ? new Prisma.Decimal(data.salePrice) : null,
                profit: calculatedProfit,
            },
            include: {
                assignedEmployee: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                profileImage: true,
                            },
                        },
                    },
                },
                conversation: {
                    select: {
                        id: true,
                        externalUserName: true,
                        platform: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                interest: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                campaign: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
                product: {
                    select: {
                        id: true,
                        name: true,
                        purchasePrice: true,
                        salePrice: true,
                    },
                },
            },
        });
    },
    /**
     * Update lead
     */
    async updateLead(id, companyId, data) {
        const lead = await prisma.lead.findFirst({
            where: {
                id,
                companyId,
            },
        });
        if (!lead) {
            throw new AppError('Lead not found', 404);
        }
        // Verify assigned employee if provided
        if (data.assignedTo) {
            const employee = await prisma.employee.findFirst({
                where: {
                    id: data.assignedTo,
                    companyId,
                },
            });
            if (!employee) {
                throw new AppError('Employee not found', 404);
            }
        }
        // Verify category if provided
        if (data.categoryId) {
            const category = await prisma.leadCategory.findFirst({
                where: {
                    id: data.categoryId,
                    companyId,
                },
            });
            if (!category) {
                throw new AppError('Lead category not found', 404);
            }
        }
        // Verify interest if provided
        if (data.interestId) {
            const interest = await prisma.leadInterest.findFirst({
                where: {
                    id: data.interestId,
                    companyId,
                },
            });
            if (!interest) {
                throw new AppError('Lead interest not found', 404);
            }
        }
        // Verify campaign if provided
        if (data.campaignId) {
            const campaign = await prisma.campaign.findFirst({
                where: {
                    id: data.campaignId,
                    companyId,
                },
            });
            if (!campaign) {
                throw new AppError('Campaign not found', 404);
            }
            // Verify campaign is active (startDate <= now <= endDate)
            const now = new Date();
            if (campaign.startDate > now || campaign.endDate < now) {
                throw new AppError('Campaign is not active', 400);
            }
        }
        return await prisma.lead.update({
            where: { id },
            data,
            include: {
                assignedEmployee: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                profileImage: true,
                            },
                        },
                    },
                },
                conversation: {
                    select: {
                        id: true,
                        externalUserName: true,
                        platform: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                interest: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                campaign: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
            },
        });
    },
    /**
     * Update lead status
     */
    async updateLeadStatus(id, companyId, status) {
        const lead = await prisma.lead.findFirst({
            where: {
                id,
                companyId,
            },
        });
        if (!lead) {
            throw new AppError('Lead not found', 404);
        }
        return await prisma.lead.update({
            where: { id },
            data: { status },
            include: {
                assignedEmployee: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                profileImage: true,
                            },
                        },
                    },
                },
                conversation: {
                    select: {
                        id: true,
                        externalUserName: true,
                        platform: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                interest: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                campaign: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
            },
        });
    },
    /**
     * Delete lead
     */
    async deleteLead(id, companyId) {
        const lead = await prisma.lead.findFirst({
            where: {
                id,
                companyId,
            },
        });
        if (!lead) {
            throw new AppError('Lead not found', 404);
        }
        return await prisma.lead.delete({
            where: { id },
        });
    },
    /**
     * Convert lead to client
     */
    async convertLeadToClient(id, companyId, clientData) {
        const lead = await prisma.lead.findFirst({
            where: {
                id,
                companyId,
            },
            include: {
                conversation: true,
            },
        });
        if (!lead) {
            throw new AppError('Lead not found', 404);
        }
        // Allow conversion from Qualified, Negotiation, or Won status
        // Automatically update status to Won if not already
        if (!['Qualified', 'Negotiation', 'Won'].includes(lead.status)) {
            throw new AppError('Only Qualified, Negotiation, or Won leads can be converted to clients', 400);
        }
        // Check if client already exists
        let client = await prisma.client.findFirst({
            where: {
                companyId,
                name: clientData?.name || lead.title,
            },
        });
        // Create client if doesn't exist
        if (!client) {
            const contactInfo = {};
            if (lead.conversation) {
                contactInfo.platform = lead.conversation.platform;
                contactInfo.externalUserId = lead.conversation.externalUserId;
                contactInfo.externalUserName = lead.conversation.externalUserName;
            }
            if (clientData?.contactInfo) {
                Object.assign(contactInfo, clientData.contactInfo);
            }
            client = await prisma.client.create({
                data: {
                    companyId,
                    name: clientData?.name || lead.title,
                    contactInfo: Object.keys(contactInfo).length > 0 ? contactInfo : undefined,
                    address: clientData?.address,
                },
            });
        }
        // Update lead status to Won to indicate conversion (if not already Won)
        if (lead.status !== 'Won') {
            await prisma.lead.update({
                where: { id },
                data: {
                    status: 'Won',
                },
            });
        }
        return client;
    },
    /**
     * Get lead pipeline statistics
     */
    async getLeadPipeline(companyId) {
        const leads = await prisma.lead.groupBy({
            by: ['status'],
            where: { companyId },
            _count: true,
            _sum: {
                value: true,
            },
        });
        return leads.map(lead => ({
            status: lead.status,
            count: lead._count,
            totalValue: Number(lead._sum.value) || 0,
        }));
    },
    /**
     * Get leads for a client from campaigns they're assigned to
     * Only accessible if client has at least one completed project
     */
    async getClientLeads(clientId, filters) {
        // Check if client has at least one completed project
        const completedProjects = await prisma.project.count({
            where: {
                clientId,
                status: 'Completed',
            },
        });
        if (completedProjects === 0) {
            throw new AppError('You must have at least one completed project to view leads', 403);
        }
        // Get campaigns where client is assigned
        const campaignClients = await prisma.campaignClient.findMany({
            where: { clientId },
            select: { campaignId: true },
        });
        const campaignIds = campaignClients.map(cc => cc.campaignId);
        if (campaignIds.length === 0) {
            return [];
        }
        // Build where clause
        const where = {
            campaignId: { in: campaignIds },
        };
        if (filters?.campaignId) {
            // Verify client is assigned to this campaign
            const isAssigned = campaignIds.includes(filters.campaignId);
            if (!isAssigned) {
                throw new AppError('You are not assigned to this campaign', 403);
            }
            where.campaignId = filters.campaignId;
        }
        // Get leads from these campaigns
        const leads = await prisma.lead.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                campaign: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                interest: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        return leads;
    },
};
//# sourceMappingURL=lead.service.js.map