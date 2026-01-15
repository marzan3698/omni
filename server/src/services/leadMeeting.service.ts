import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { LeadMeetingStatus } from '@prisma/client';

interface CreateLeadMeetingData {
  companyId: number;
  leadId: number;
  clientId?: number;
  createdBy: string;
  title: string;
  description?: string;
  meetingTime: Date;
  durationMinutes: number;
  googleMeetUrl: string;
  status?: LeadMeetingStatus;
}

interface UpdateLeadMeetingData {
  title?: string;
  description?: string;
  meetingTime?: Date;
  durationMinutes?: number;
  googleMeetUrl?: string;
  status?: LeadMeetingStatus;
}

export const leadMeetingService = {
  async getLeadMeetings(leadId: number, companyId: number) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, companyId },
      select: { id: true },
    });

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    return prisma.leadMeeting.findMany({
      where: { leadId, companyId },
      orderBy: { meetingTime: 'asc' },
    });
  },

  async createLeadMeeting(data: CreateLeadMeetingData) {
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

    return prisma.leadMeeting.create({
      data: {
        companyId: data.companyId,
        leadId: data.leadId,
        clientId: data.clientId,
        createdBy: data.createdBy,
        title: data.title,
        description: data.description,
        meetingTime: data.meetingTime,
        durationMinutes: data.durationMinutes,
        googleMeetUrl: data.googleMeetUrl,
        status: data.status || 'Scheduled',
      },
    });
  },

  async updateLeadMeeting(id: number, leadId: number, companyId: number, data: UpdateLeadMeetingData) {
    const meeting = await prisma.leadMeeting.findFirst({
      where: {
        id,
        leadId,
        companyId,
      },
    });

    if (!meeting) {
      throw new AppError('Lead meeting not found', 404);
    }

    return prisma.leadMeeting.update({
      where: { id },
      data,
    });
  },

  async deleteLeadMeeting(id: number, leadId: number, companyId: number) {
    const meeting = await prisma.leadMeeting.findFirst({
      where: {
        id,
        leadId,
        companyId,
      },
    });

    if (!meeting) {
      throw new AppError('Lead meeting not found', 404);
    }

    return prisma.leadMeeting.delete({
      where: { id },
    });
  },

  /**
   * Get all meetings for a company with role-based filtering
   */
  async getAllMeetings(
    companyId: number,
    userId?: string,
    userRole?: string,
    filters?: {
      status?: LeadMeetingStatus;
      startDate?: Date;
      endDate?: Date;
      leadId?: number;
    }
  ) {
    const where: any = {
      companyId,
    };

    // Role-based filtering
    if (userRole === 'SuperAdmin' || userRole === 'Admin') {
      // SuperAdmin and Admin see all company meetings
    } else if (userId) {
      // Other users see only meetings for their assigned/created leads
      const employee = await prisma.employee.findFirst({
        where: {
          userId,
          companyId,
        },
        select: { id: true },
      });

      if (employee) {
        where.lead = {
          OR: [
            { createdBy: userId },
            { assignedTo: employee.id },
          ],
        };
      } else {
        // If user has no employee record, only show meetings for leads they created
        where.lead = {
          createdBy: userId,
        };
      }
    }

    // Apply filters
    if (filters?.status) {
      where.status = filters.status;
    } else {
      // Default to Scheduled if no status filter
      where.status = 'Scheduled';
    }

    if (filters?.startDate || filters?.endDate) {
      where.meetingTime = {};
      if (filters.startDate) {
        where.meetingTime.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.meetingTime.lte = filters.endDate;
      }
    }

    if (filters?.leadId) {
      where.leadId = filters.leadId;
    }

    return prisma.leadMeeting.findMany({
      where,
      orderBy: { meetingTime: 'asc' },
      include: {
        lead: {
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
            createdByUser: {
              select: {
                id: true,
                email: true,
                profileImage: true,
              },
            },
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

  /**
   * Get next upcoming meeting for a user (within 1 hour)
   */
  async getUpcomingMeeting(userId: string, companyId: number) {
    // Find user's employee record
    const employee = await prisma.employee.findFirst({
      where: {
        userId,
        companyId,
      },
      select: { id: true },
    });

    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const where: any = {
      companyId,
      status: 'Scheduled',
      meetingTime: {
        gte: now,
        lte: oneHourLater,
      },
    };

    // Filter by user's assigned/created leads
    if (employee) {
      where.lead = {
        OR: [
          { createdBy: userId },
          { assignedTo: employee.id },
        ],
      };
    } else {
      // If user has no employee record, only check createdBy
      where.lead = {
        createdBy: userId,
      };
    }

    const meeting = await prisma.leadMeeting.findFirst({
      where,
      orderBy: { meetingTime: 'asc' },
      include: {
        lead: {
          select: {
            id: true,
            title: true,
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
            createdByUser: {
              select: {
                id: true,
                email: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    return meeting;
  },
};

