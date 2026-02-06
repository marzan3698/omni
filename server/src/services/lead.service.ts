import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { LeadSource, LeadStatus, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

interface CreateLeadData {
  companyId: number;
  createdBy: string;
  title: string;
  description?: string;
  source: LeadSource;
  status?: LeadStatus;
  assignedTo?: number;
  value?: number;
  conversationId?: number;
  customerName?: string;
  phone?: string;
  categoryId?: number;
  interestId?: number;
  campaignId?: number;
  productId?: number;
  purchasePrice?: number;
  salePrice?: number;
  profit?: number;
}

interface UpdateLeadData {
  title?: string;
  description?: string;
  source?: LeadSource;
  status?: LeadStatus;
  assignedTo?: number;
  value?: number;
  customerName?: string;
  phone?: string;
  categoryId?: number;
  interestId?: number;
  campaignId?: number;
}

export const leadService = {
  /**
   * Get all leads (optionally filtered by user who created them)
   */
  async getAllLeads(filters?: {
    createdBy?: string;
    status?: LeadStatus;
    source?: LeadSource;
    assignedTo?: number;
    categoryId?: number;
    interestId?: number;
    search?: string;
    convertedOnly?: boolean;
  }) {
    const where: any = {};

    // Complete tab: only leads converted to client; All Leads tab: exclude converted
    if (filters?.convertedOnly === true) {
      where.convertedToClientId = { not: null };
    } else {
      where.convertedToClientId = null;
    }

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
  async getLeadById(id: number, companyId: number) {
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
  async createLeadFromInbox(conversationId: number, userId: string, data: {
    title: string;
    description?: string;
    assignedTo?: number;
    value?: number;
    customerName?: string;
    phone?: string;
    categoryId?: number;
    interestId?: number;
    campaignId?: number;
    productId?: number;
    purchasePrice?: number;
    salePrice?: number;
    profit?: number;
  }) {
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

    // Verify category (optional)
    if (data.categoryId && data.categoryId > 0) {
      const category = await prisma.leadCategory.findFirst({
        where: {
          id: data.categoryId,
        },
      });
      if (!category) {
        throw new AppError('Lead category not found', 404);
      }
    }

    // Verify interest (optional)
    if (data.interestId && data.interestId > 0) {
      const interest = await prisma.leadInterest.findFirst({
        where: {
          id: data.interestId,
        },
      });
      if (!interest) {
        throw new AppError('Lead interest not found', 404);
      }
    }

    // Verify campaign (optional)
    if (data.campaignId && data.campaignId > 0) {
      const campaign = await prisma.campaign.findFirst({
        where: {
          id: data.campaignId,
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

    // Verify product if provided and get leadPoint
    let productLeadPoint: number | null = null;
    if (data.productId) {
      const product = await prisma.product.findFirst({
        where: {
          id: data.productId,
        },
      });
      if (!product) {
        throw new AppError('Product not found', 404);
      }
      // Get leadPoint from product for reserve points calculation
      productLeadPoint = product.leadPoint ? Number(product.leadPoint) : null;
    }

    // Calculate profit if purchasePrice and salePrice are provided
    let calculatedProfit: Prisma.Decimal | null = null;
    if (data.purchasePrice !== undefined && data.salePrice !== undefined && 
        data.purchasePrice !== null && data.salePrice !== null) {
      calculatedProfit = new Prisma.Decimal(data.salePrice).minus(new Prisma.Decimal(data.purchasePrice));
    } else if (data.profit !== undefined && data.profit !== null) {
      // Use provided profit if calculation wasn't possible
      calculatedProfit = new Prisma.Decimal(data.profit);
    }

    // Create lead and update reserve points in a transaction
    return await prisma.$transaction(async (tx) => {
      // Create the lead
      const lead = await tx.lead.create({
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
          categoryId: data.categoryId || null,
          interestId: data.interestId || null,
          campaignId: data.campaignId || null,
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

      // If product has leadPoint, add to creator's reservePoints
      if (productLeadPoint && productLeadPoint > 0) {
        // Find the employee record for the user who created the lead
        const employee = await tx.employee.findFirst({
          where: { userId },
        });

        if (employee) {
          await tx.employee.update({
            where: { id: employee.id },
            data: {
              reservePoints: {
                increment: productLeadPoint,
              },
            },
          });
          console.log(`Added ${productLeadPoint} reserve points to employee ${employee.id} for lead ${lead.id}`);
        }
      }

      return lead;
    });
  },

  /**
   * Create lead
   */
  async createLead(data: CreateLeadData) {
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
    let calculatedProfit: Prisma.Decimal | null = null;
    if (data.purchasePrice !== undefined && data.salePrice !== undefined && 
        data.purchasePrice !== null && data.salePrice !== null) {
      calculatedProfit = new Prisma.Decimal(data.salePrice).minus(new Prisma.Decimal(data.purchasePrice));
    } else if (data.profit !== undefined && data.profit !== null) {
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
  async updateLead(id: number, companyId: number, data: UpdateLeadData) {
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
   * When status becomes 'Won', transfer points from reservePoints to mainPoints
   */
  async updateLeadStatus(id: number, companyId: number, status: LeadStatus) {
    const lead = await prisma.lead.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        product: true,
      },
    });

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    // If status is changing to Won and lead has a product with leadPoint
    // Transfer points from reservePoints to mainPoints
    if (status === 'Won' && lead.status !== 'Won' && lead.productId) {
      return await prisma.$transaction(async (tx) => {
        // Update lead status
        const updatedLead = await tx.lead.update({
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

        // Get the product's leadPoint
        const product = await tx.product.findUnique({
          where: { id: lead.productId! },
        });

        if (product && product.leadPoint && Number(product.leadPoint) > 0) {
          const pointsToTransfer = Number(product.leadPoint);

          // Find the employee who created this lead
          const employee = await tx.employee.findFirst({
            where: { userId: lead.createdBy },
          });

          if (employee) {
            // Transfer points: subtract from reservePoints, add to mainPoints
            await tx.employee.update({
              where: { id: employee.id },
              data: {
                reservePoints: {
                  decrement: pointsToTransfer,
                },
                mainPoints: {
                  increment: pointsToTransfer,
                },
              },
            });
            console.log(`Transferred ${pointsToTransfer} points from reserve to main for employee ${employee.id} (lead ${lead.id} completed)`);
          }
        }

        return updatedLead;
      });
    }

    // Normal status update without points transfer
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
  async deleteLead(id: number, companyId: number) {
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
   * Convert lead to client.
   * Creates Client record and a User with Client role (for login) when password is provided.
   */
  async convertLeadToClient(id: number, companyId: number, clientData?: {
    name?: string;
    contactInfo?: { email?: string; phone?: string; [key: string]: any };
    address?: string;
    password?: string;
  }) {
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
    if (!['Qualified', 'Negotiation', 'Won'].includes(lead.status)) {
      throw new AppError('Only Qualified, Negotiation, or Won leads can be converted to clients', 400);
    }

    const clientName = clientData?.name || lead.title;
    const contactInfo: any = {};

    if (lead.conversation) {
      contactInfo.platform = lead.conversation.platform;
      contactInfo.externalUserId = lead.conversation.externalUserId;
      contactInfo.externalUserName = lead.conversation.externalUserName;
    }
    if (clientData?.contactInfo) {
      Object.assign(contactInfo, clientData.contactInfo);
    }

    // Check if client already exists (by name)
    let client = await prisma.client.findFirst({
      where: {
        companyId,
        name: clientName,
      },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          companyId,
          name: clientName,
          contactInfo: Object.keys(contactInfo).length > 0 ? contactInfo : undefined,
          address: clientData?.address,
        },
      });
    } else if (clientData?.contactInfo && Object.keys(clientData.contactInfo).length > 0) {
      // Update contactInfo if client exists and new contact info provided
      const updatedContactInfo = { ...((client.contactInfo as object) || {}), ...clientData.contactInfo };
      await prisma.client.update({
        where: { id: client.id },
        data: { contactInfo: updatedContactInfo, address: clientData.address ?? client.address },
      });
    }

    // Create or update User for client login when password is provided
    const email =
      (clientData?.contactInfo as any)?.email ??
      (client?.contactInfo as any)?.email ??
      contactInfo?.email;
    if (clientData?.password && clientData.password.trim().length >= 6) {
      if (!email || typeof email !== 'string' || !email.trim()) {
        throw new AppError('Email is required for client login', 400);
      }
      const emailLower = email.trim().toLowerCase();
      const passwordHash = await bcrypt.hash(clientData.password.trim(), 10);

      const clientRole = await prisma.role.findFirst({
        where: { name: 'Client' },
      });
      if (!clientRole) {
        throw new AppError('Client role not found. Please seed roles.', 500);
      }

      const existingUser = await prisma.user.findFirst({
        where: {
          email: emailLower,
          companyId,
        },
      });

      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { passwordHash, name: clientName || existingUser.name },
        });
      } else {
        await prisma.user.create({
          data: {
            email: emailLower,
            passwordHash,
            roleId: clientRole.id,
            companyId,
            name: clientName || null,
            phone: contactInfo?.phone || null,
            address: clientData?.address || null,
          },
        });
      }
    }

    // Update lead status to Won and set convertedToClientId
    await prisma.lead.update({
      where: { id },
      data: {
        status: 'Won',
        convertedToClientId: client.id,
      },
    });

    return client;
  },

  /**
   * Get lead pipeline statistics
   */
  async getLeadPipeline(companyId: number) {
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
  async getClientLeads(clientId: string, filters?: { campaignId?: number }) {
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
    const where: any = {
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

