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
  assignedTo?: number[];
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
  assignedTo?: number[];
  value?: number;
  customerName?: string;
  phone?: string;
  categoryId?: number;
  interestId?: number;
  campaignId?: number;
}

const leadAssignmentsInclude = {
  assignments: {
    include: {
      employee: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              profileImage: true,
              role: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  },
};

export const leadService = {
  /**
   * Get all leads (optionally filtered by user who created them)
   */
  async getAllLeads(filters?: {
    createdBy?: string;
    createdByOrAssignedToUserId?: string;
    leadManagerUserId?: string;
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

    // Show leads where user created OR is assigned (for non–Lead Manager / non-SuperAdmin)
    const accessOr =
      filters?.createdByOrAssignedToUserId
        ? [
            { createdBy: filters.createdByOrAssignedToUserId },
            { assignments: { some: { employee: { userId: filters.createdByOrAssignedToUserId } } } },
          ]
        : null;
    const searchOr = filters?.search
      ? [
          { title: { contains: filters.search } },
          { customerName: { contains: filters.search } },
          { phone: { contains: filters.search } },
          { description: { contains: filters.search } },
        ]
      : null;

    if (accessOr && searchOr) {
      where.AND = [{ OR: accessOr }, { OR: searchOr }];
    } else if (accessOr) {
      where.OR = accessOr;
    } else if (filters?.createdBy) {
      where.createdBy = filters.createdBy;
    }
    if (searchOr && !accessOr) {
      where.OR = searchOr;
    }

    // Lead Manager: only unassigned leads (no monitoring incharge) OR leads they monitor
    if (filters?.leadManagerUserId) {
      const monitoringOr = {
        OR: [
          { leadMonitoringUserId: null },
          { leadMonitoringUserId: filters.leadManagerUserId },
        ],
      };
      if (!where.AND) where.AND = [];
      where.AND.push(monitoringOr);
    }

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.source) {
      where.source = filters.source;
    }
    if (filters?.assignedTo) {
      where.assignments = { some: { employeeId: filters.assignedTo } };
    }
    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters?.interestId) {
      where.interestId = filters.interestId;
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
        ...leadAssignmentsInclude,
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
        leadMonitoringUser: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            role: { select: { id: true, name: true } },
          },
        },
        ...leadAssignmentsInclude,
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
        clientApprovalRequest: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
            approvedByUser: {
              select: {
                id: true,
                name: true,
                email: true,
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
    assignedTo?: number[];
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

    // Verify assigned employees if provided
    if (data.assignedTo && data.assignedTo.length > 0) {
      const employees = await prisma.employee.findMany({
        where: { id: { in: data.assignedTo } },
      });
      if (employees.length !== data.assignedTo.length) {
        throw new AppError('One or more employees not found', 404);
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
          ...leadAssignmentsInclude,
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

      // Create lead assignments
      if (data.assignedTo && data.assignedTo.length > 0) {
        await tx.leadAssignment.createMany({
          data: data.assignedTo.map((employeeId) => ({
            leadId: lead.id,
            employeeId,
          })),
          skipDuplicates: true,
        });
      }

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

      // Re-fetch lead with assignments for response
      const resultLead = await tx.lead.findUnique({
        where: { id: lead.id },
        include: {
          createdByUser: { select: { id: true, email: true, profileImage: true } },
          ...leadAssignmentsInclude,
          conversation: { select: { id: true, externalUserName: true, platform: true } },
          category: { select: { id: true, name: true } },
          interest: { select: { id: true, name: true } },
          campaign: { select: { id: true, name: true, type: true } },
        },
      });
      if (!resultLead) throw new AppError('Lead not found after create', 500);
      return resultLead;
    });
  },

  /**
   * Create lead
   */
  async createLead(data: CreateLeadData) {
    // Verify assigned employees if provided
    if (data.assignedTo && data.assignedTo.length > 0) {
      const employees = await prisma.employee.findMany({
        where: {
          id: { in: data.assignedTo },
          companyId: data.companyId,
        },
      });
      if (employees.length !== data.assignedTo.length) {
        throw new AppError('One or more employees not found', 404);
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

    const lead = await prisma.lead.create({
      data: {
        companyId: data.companyId,
        createdBy: data.createdBy,
        title: data.title,
        description: data.description,
        source: data.source,
        status: data.status || 'New',
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
        ...leadAssignmentsInclude,
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

    if (data.assignedTo && data.assignedTo.length > 0) {
      await prisma.leadAssignment.createMany({
        data: data.assignedTo.map((employeeId) => ({
          leadId: lead.id,
          employeeId,
        })),
        skipDuplicates: true,
      });
      return prisma.lead.findUniqueOrThrow({
        where: { id: lead.id },
        include: {
          createdByUser: { select: { id: true, email: true, profileImage: true } },
          ...leadAssignmentsInclude,
          conversation: { select: { id: true, externalUserName: true, platform: true } },
          category: { select: { id: true, name: true } },
          interest: { select: { id: true, name: true } },
          campaign: { select: { id: true, name: true, type: true } },
          product: { select: { id: true, name: true, purchasePrice: true, salePrice: true } },
        },
      });
    }
    return lead;
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

    // Verify assigned employees if provided
    if (data.assignedTo && data.assignedTo.length > 0) {
      const employees = await prisma.employee.findMany({
        where: {
          id: { in: data.assignedTo },
          companyId,
        },
      });
      if (employees.length !== data.assignedTo.length) {
        throw new AppError('One or more employees not found', 404);
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

    const { assignedTo: assignedToIds, ...updateData } = data;
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        ...leadAssignmentsInclude,
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

    if (assignedToIds !== undefined) {
      await prisma.leadAssignment.deleteMany({ where: { leadId: id } });
      if (assignedToIds.length > 0) {
        await prisma.leadAssignment.createMany({
          data: assignedToIds.map((employeeId) => ({ leadId: id, employeeId })),
          skipDuplicates: true,
        });
      }
      return prisma.lead.findUniqueOrThrow({
        where: { id },
        include: {
          ...leadAssignmentsInclude,
          conversation: { select: { id: true, externalUserName: true, platform: true } },
          category: { select: { id: true, name: true } },
          interest: { select: { id: true, name: true } },
          campaign: { select: { id: true, name: true, type: true } },
        },
      });
    }
    return updatedLead;
  },

  /**
   * Update lead status
   * When status becomes 'Won', transfer points from reservePoints to mainPoints
   */
  async updateLeadStatus(
    id: number,
    companyId: number,
    status: LeadStatus,
    actorUserId: string,
    bypassMonitoringLock = false
  ) {
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

    // Enforce "lead monitoring incharge" lock:
    // - First Lead Manager who changes status becomes the monitoring incharge.
    // - Another Lead Manager cannot change status unless monitoring is transferred.
    if (lead.leadMonitoringUserId && lead.leadMonitoringUserId !== actorUserId && !bypassMonitoringLock) {
      throw new AppError('This lead is being monitored by another Lead Manager. Ask them to transfer monitoring responsibility.', 403);
    }

    const shouldAssignMonitoring =
      !lead.leadMonitoringUserId && lead.status !== status;
    const monitoringData = shouldAssignMonitoring
      ? {
          leadMonitoringUserId: actorUserId,
          leadMonitoringAssignedAt: new Date(),
        }
      : {};

    // If status is changing to Won and lead has a product with leadPoint
    // Transfer points from reservePoints to mainPoints
    if (status === 'Won' && lead.status !== 'Won' && lead.productId) {
      return await prisma.$transaction(async (tx) => {
        // Update lead status
        const updatedLead = await tx.lead.update({
          where: { id },
          data: { status, ...monitoringData },
          include: {
            leadMonitoringUser: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
                role: { select: { id: true, name: true } },
              },
            },
            ...leadAssignmentsInclude,
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
      data: { status, ...monitoringData },
      include: {
        leadMonitoringUser: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            role: { select: { id: true, name: true } },
          },
        },
        ...leadAssignmentsInclude,
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
   * Assign users (employees) to a lead
   */
  async assignUsersToLead(leadId: number, companyId: number, employeeIds: number[]) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, companyId },
    });
    if (!lead) {
      throw new AppError('Lead not found', 404);
    }
    if (employeeIds.length === 0) {
      return this.getLeadById(leadId, companyId);
    }
    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds }, companyId },
    });
    if (employees.length !== employeeIds.length) {
      throw new AppError('One or more employees not found', 404);
    }
    await prisma.leadAssignment.createMany({
      data: employeeIds.map((employeeId) => ({ leadId, employeeId })),
      skipDuplicates: true,
    });
    return this.getLeadById(leadId, companyId);
  },

  /**
   * Remove a user (employee) from a lead
   */
  async removeUserFromLead(leadId: number, companyId: number, employeeId: number) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, companyId },
    });
    if (!lead) {
      throw new AppError('Lead not found', 404);
    }
    await prisma.leadAssignment.deleteMany({
      where: { leadId, employeeId },
    });
    return this.getLeadById(leadId, companyId);
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
   * Convert lead to client (pending approval flow).
   * Only Won leads can be converted. Creates Client (status Processing), ClientApprovalRequest,
   * credits lead manager's reservePoints, and does NOT create User until approval.
   */
  async convertLeadToClient(
    id: number,
    companyId: number,
    requestedByUserId: string,
    clientData: {
      name?: string;
      contactInfo?: { email?: string; phone?: string; [key: string]: any };
      address?: string;
      password: string;
    },
    options?: { bypassMonitoringLock?: boolean }
  ) {
    const lead = await prisma.lead.findFirst({
      where: { id, companyId },
      include: { conversation: true, product: true },
    });

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    // Only the current monitoring incharge can convert (unless monitoring not assigned yet).
    if (lead.leadMonitoringUserId && lead.leadMonitoringUserId !== requestedByUserId && !options?.bypassMonitoringLock) {
      throw new AppError('This lead is being monitored by another Lead Manager. Ask them to transfer monitoring responsibility before converting.', 403);
    }

    if (lead.status !== 'Won') {
      throw new AppError('Only leads with status Won can be converted to clients', 400);
    }

    if (lead.convertedToClientId) {
      throw new AppError('Lead is already converted to a client', 400);
    }

    const email =
      (clientData?.contactInfo as any)?.email ??
      (lead.conversation as any)?.externalUserName ??
      '';
    if (!email || typeof email !== 'string' || !email.trim()) {
      throw new AppError('Email is required for client login (needed for approval)', 400);
    }
    if (!clientData?.password || clientData.password.trim().length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    const employee = await prisma.employee.findFirst({
      where: { userId: requestedByUserId, companyId },
    });
    if (!employee) {
      throw new AppError('Lead manager employee record not found', 404);
    }

    const clientName = clientData?.name || lead.customerName || lead.title;
    const contactInfo: Record<string, unknown> = {};
    if (lead.conversation) {
      contactInfo.platform = lead.conversation.platform;
      contactInfo.externalUserId = lead.conversation.externalUserId;
      contactInfo.externalUserName = lead.conversation.externalUserName;
    }
    if (clientData?.contactInfo) {
      Object.assign(contactInfo, clientData.contactInfo);
    }
    contactInfo.email = email.trim().toLowerCase();

    const customerPoints = lead.productId && lead.product
      ? Number(lead.product.customerPoint ?? 0)
      : 0;

    const passwordHash = await bcrypt.hash(clientData.password.trim(), 10);

    return await prisma.$transaction(async (tx) => {
      const now = new Date();

      const client = await tx.client.create({
        data: {
          companyId,
          name: clientName,
          contactInfo: Object.keys(contactInfo).length > 0 ? contactInfo : undefined,
          address: clientData?.address ?? null,
          status: 'Processing',
        },
      });

      await tx.clientApprovalRequest.create({
        data: {
          companyId,
          leadId: id,
          clientId: client.id,
          requestedByUserId,
          requestedByEmployeeId: employee.id,
          email: (contactInfo.email as string) || email.trim().toLowerCase(),
          passwordHash,
          customerPoints: customerPoints,
          status: 'Pending',
        },
      });

      await tx.lead.update({
        where: { id },
        data: {
          convertedToClientId: client.id,
          ...(lead.leadMonitoringUserId
            ? {}
            : { leadMonitoringUserId: requestedByUserId, leadMonitoringAssignedAt: now }),
        },
      });

      if (customerPoints > 0) {
        await tx.employee.update({
          where: { id: employee.id },
          data: {
            reservePoints: { increment: customerPoints },
          },
        });
      }

      return client;
    });
  },

  async getLeadManagers(companyId: number) {
    return prisma.user.findMany({
      where: {
        companyId,
        role: { name: 'Lead Manager' },
      },
      orderBy: [{ name: 'asc' }, { email: 'asc' }],
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
      },
    });
  },

  async transferLeadMonitoring(
    leadId: number,
    companyId: number,
    actorUserId: string,
    newLeadManagerUserId: string,
    options?: { bypassMonitoringLock?: boolean }
  ) {
    if (actorUserId === newLeadManagerUserId) {
      throw new AppError('New Lead Manager must be different', 400);
    }

    const lead = await prisma.lead.findFirst({
      where: { id: leadId, companyId },
      select: {
        id: true,
        leadMonitoringUserId: true,
      },
    });
    if (!lead) {
      throw new AppError('Lead not found', 404);
    }
    if (!lead.leadMonitoringUserId) {
      throw new AppError('Monitoring incharge is not assigned yet. Change status once to assign monitoring.', 400);
    }
    if (lead.leadMonitoringUserId !== actorUserId && !options?.bypassMonitoringLock) {
      throw new AppError('Only the current monitoring incharge can transfer monitoring responsibility', 403);
    }

    const target = await prisma.user.findFirst({
      where: {
        id: newLeadManagerUserId,
        companyId,
        role: { name: 'Lead Manager' },
      },
      select: { id: true },
    });
    if (!target) {
      throw new AppError('Target user is not a Lead Manager in this company', 400);
    }

    return prisma.lead.update({
      where: { id: leadId },
      data: {
        leadMonitoringUserId: newLeadManagerUserId,
        leadMonitoringTransferredAt: new Date(),
      },
      include: {
        leadMonitoringUser: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            role: { select: { id: true, name: true } },
          },
        },
        ...leadAssignmentsInclude,
      },
    });
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

