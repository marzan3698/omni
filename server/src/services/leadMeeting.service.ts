import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { LeadMeetingStatus } from '@prisma/client';
import { assertEmployeeAvailable } from './booking.service.js';

const assignedEmployeeInclude = {
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
};

interface CreateLeadMeetingData {
  companyId: number;
  leadId: number;
  assignedTo: number;
  clientId?: number;
  createdBy: string;
  title: string;
  description?: string;
  meetingTime: Date;
  durationMinutes: number;
  platform: string;
  meetingLink: string;
  status?: LeadMeetingStatus;
}

interface UpdateLeadMeetingData {
  assignedTo?: number;
  title?: string;
  description?: string;
  meetingTime?: Date;
  durationMinutes?: number;
  platform?: string;
  meetingLink?: string;
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
      include: assignedEmployeeInclude,
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

    await assertEmployeeAvailable({
      companyId: data.companyId,
      employeeId: data.assignedTo,
      startTime: data.meetingTime,
      durationMinutes: data.durationMinutes,
    });

    return prisma.leadMeeting.create({
      data: {
        companyId: data.companyId,
        leadId: data.leadId,
        assignedTo: data.assignedTo,
        clientId: data.clientId,
        createdBy: data.createdBy,
        title: data.title,
        description: data.description,
        meetingTime: data.meetingTime,
        durationMinutes: data.durationMinutes,
        platform: data.platform,
        meetingLink: data.meetingLink,
        status: data.status || 'Scheduled',
      },
      include: assignedEmployeeInclude,
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

    if (data.assignedTo !== undefined) {
      const employee = await prisma.employee.findFirst({
        where: {
          id: data.assignedTo,
          companyId,
        },
      });
      if (!employee) {
        throw new AppError('Assigned employee not found', 404);
      }
    }

    const employeeId = data.assignedTo ?? meeting.assignedTo;
    const startTime = data.meetingTime ?? meeting.meetingTime;
    const durationMinutes = data.durationMinutes ?? meeting.durationMinutes;
    await assertEmployeeAvailable({
      companyId,
      employeeId,
      startTime,
      durationMinutes,
      excludeMeetingId: id,
    });

    return prisma.leadMeeting.update({
      where: { id },
      data,
      include: assignedEmployeeInclude,
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

    // Role-based filtering: managers see all; others see only meetings assigned to them
    if (userRole !== 'SuperAdmin' && userRole !== 'Admin' && userRole !== 'Lead Manager' && userId) {
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
        // No employee record: show nothing (no meetings assigned)
        where.assignedTo = -1;
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
        ...assignedEmployeeInclude,
        lead: {
          include: {
            assignments: {
              include: {
                employee: {
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

    // Filter by user's assigned meetings only
    if (employee) {
      where.assignedTo = employee.id;
    } else {
      // No employee record: no upcoming meeting
      where.assignedTo = -1;
    }

    const meeting = await prisma.leadMeeting.findFirst({
      where,
      orderBy: { meetingTime: 'asc' },
      include: {
        ...assignedEmployeeInclude,
        lead: {
          select: {
            id: true,
            title: true,
            assignments: {
              include: {
                employee: {
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

