import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { LeadSource, LeadStatus } from '@prisma/client';

interface CreateLeadData {
  companyId: number;
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
}

export const leadService = {
  /**
   * Get all leads for a company
   */
  async getAllLeads(companyId: number, filters?: {
    status?: LeadStatus;
    source?: LeadSource;
    assignedTo?: number;
  }) {
    return await prisma.lead.findMany({
      where: {
        companyId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.source && { source: filters.source }),
        ...(filters?.assignedTo && { assignedTo: filters.assignedTo }),
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
  async createLeadFromInbox(conversationId: number, companyId: number, data: {
    title: string;
    description?: string;
    assignedTo?: number;
    value?: number;
    customerName?: string;
    phone?: string;
    categoryId?: number;
    interestId?: number;
  }) {
    // Verify conversation exists
    const conversation = await prisma.socialConversation.findFirst({
      where: {
        id: conversationId,
        companyId,
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
        companyId,
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

    // Create lead
    return await prisma.lead.create({
      data: {
        companyId,
        title: data.title,
        description: data.description,
        source: 'Inbox',
        status: 'New',
        assignedTo: data.assignedTo,
        value: data.value,
        conversationId,
        customerName: data.customerName,
        phone: data.phone,
        categoryId: data.categoryId,
        interestId: data.interestId,
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
      },
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

    return await prisma.lead.create({
      data: {
        companyId: data.companyId,
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
      },
    });
  },

  /**
   * Update lead status
   */
  async updateLeadStatus(id: number, companyId: number, status: LeadStatus) {
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
   * Convert lead to client
   */
  async convertLeadToClient(id: number, companyId: number, clientData?: {
    name?: string;
    contactInfo?: any;
    address?: string;
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

    if (lead.status !== 'Won') {
      throw new AppError('Only won leads can be converted to clients', 400);
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
      const contactInfo: any = {};
      
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

    // Update lead status to indicate conversion
    await prisma.lead.update({
      where: { id },
      data: {
        status: 'Won',
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
};

