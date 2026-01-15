import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { LeadCallStatus } from '@prisma/client';

interface CreateLeadCallData {
  companyId: number;
  leadId: number;
  clientId?: number;
  assignedTo: number;
  createdBy: string;
  title?: string;
  phoneNumber?: string;
  callTime: Date;
  durationMinutes?: number;
  status?: LeadCallStatus;
}

interface UpdateLeadCallData {
  title?: string;
  phoneNumber?: string;
  callTime?: Date;
  durationMinutes?: number;
  status?: LeadCallStatus;
  assignedTo?: number;
}

export const leadCallService = {
  async getLeadCalls(leadId: number, companyId: number) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, companyId },
      select: { id: true },
    });

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    return prisma.leadCall.findMany({
      where: { leadId, companyId },
      orderBy: { callTime: 'asc' },
      include: {
        assignedEmployee: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });
  },

  async createLeadCall(data: CreateLeadCallData) {
    const lead = await prisma.lead.findFirst({
      where: {
        id: data.leadId,
        companyId: data.companyId,
      },
      select: {
        id: true,
        companyId: true,
      },
    });

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    // Verify assigned employee exists
    const employee = await prisma.employee.findFirst({
      where: {
        id: data.assignedTo,
        companyId: data.companyId,
      },
    });

    if (!employee) {
      throw new AppError('Assigned employee not found', 404);
    }

    if (data.clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: data.clientId,
          companyId: data.companyId,
        },
      });

      if (!client) {
        throw new AppError('Client not found', 404);
      }
    }

    return prisma.leadCall.create({
      data: {
        companyId: data.companyId,
        leadId: data.leadId,
        clientId: data.clientId,
        assignedTo: data.assignedTo,
        createdBy: data.createdBy,
        title: data.title,
        phoneNumber: data.phoneNumber,
        callTime: data.callTime,
        durationMinutes: data.durationMinutes,
        status: data.status || 'Scheduled',
      },
      include: {
        assignedEmployee: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });
  },

  async updateLeadCall(id: number, leadId: number, companyId: number, data: UpdateLeadCallData) {
    const call = await prisma.leadCall.findFirst({
      where: {
        id,
        leadId,
        companyId,
      },
    });

    if (!call) {
      throw new AppError('Lead call not found', 404);
    }

    // If assignedTo is being updated, verify employee exists
    if (data.assignedTo) {
      const employee = await prisma.employee.findFirst({
        where: {
          id: data.assignedTo,
          companyId: companyId,
        },
      });

      if (!employee) {
        throw new AppError('Assigned employee not found', 404);
      }
    }

    return prisma.leadCall.update({
      where: { id },
      data,
      include: {
        assignedEmployee: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });
  },

  async deleteLeadCall(id: number, leadId: number, companyId: number) {
    const call = await prisma.leadCall.findFirst({
      where: {
        id,
        leadId,
        companyId,
      },
    });

    if (!call) {
      throw new AppError('Lead call not found', 404);
    }

    return prisma.leadCall.delete({
      where: { id },
    });
  },

  async addCallNote(id: number, leadId: number, companyId: number, note: string) {
    const call = await prisma.leadCall.findFirst({
      where: {
        id,
        leadId,
        companyId,
      },
    });

    if (!call) {
      throw new AppError('Lead call not found', 404);
    }

    return prisma.leadCall.update({
      where: { id },
      data: { notes: note },
      include: {
        assignedEmployee: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });
  },

  /**
   * Get all calls for a company with role-based filtering
   */
  async getAllCalls(
    companyId: number,
    userId?: string,
    userRole?: string,
    filters?: {
      status?: LeadCallStatus;
      startDate?: Date;
      endDate?: Date;
      leadId?: number;
      assignedTo?: number;
    }
  ) {
    const where: any = {
      companyId,
    };

    // Role-based filtering
    if (userRole === 'SuperAdmin' || userRole === 'Admin') {
      // SuperAdmin and Admin see all company calls
    } else if (userId) {
      // Other users see only calls assigned to them
      const employee = await prisma.employee.findFirst({
        where: {
          userId,
          companyId,
        },
        select: { id: true },
      });

      if (employee) {
        where.assignedTo = employee.id;
      } else {
        // If user has no employee record, return empty
        return [];
      }
    }

    // Apply filters
    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.callTime = {};
      if (filters.startDate) {
        where.callTime.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.callTime.lte = filters.endDate;
      }
    }

    if (filters?.leadId) {
      where.leadId = filters.leadId;
    }

    // Only allow assignedTo filter override for SuperAdmin/Admin
    // For other users, we've already set assignedTo based on their employee record
    if (filters?.assignedTo && (userRole === 'SuperAdmin' || userRole === 'Admin')) {
      where.assignedTo = filters.assignedTo;
    }

    return prisma.leadCall.findMany({
      where,
      orderBy: { callTime: 'asc' },
      include: {
        lead: {
          select: {
            id: true,
            title: true,
            phone: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedEmployee: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });
  },

  /**
   * Get upcoming calls for an assigned employee
   */
  async getUpcomingCalls(userId: string, companyId: number) {
    // Find user's employee record
    const employee = await prisma.employee.findFirst({
      where: {
        userId,
        companyId,
      },
      select: { id: true },
    });

    if (!employee) {
      return [];
    }

    const now = new Date();

    return prisma.leadCall.findMany({
      where: {
        companyId,
        assignedTo: employee.id,
        status: 'Scheduled',
        callTime: {
          gte: now,
        },
      },
      orderBy: { callTime: 'asc' },
      take: 10, // Limit to 10 upcoming calls
      include: {
        lead: {
          select: {
            id: true,
            title: true,
            phone: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },
};
