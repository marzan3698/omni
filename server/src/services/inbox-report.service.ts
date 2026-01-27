import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export interface InboxReportFilters {
  startDate?: string;
  endDate?: string;
  labelName?: string;
}

export interface InboxReportData {
  summary: {
    totalConversations: number;
    totalUniqueUsers: number;
    totalMessages: number;
    openConversations: number;
    closedConversations: number;
  };
  employeePerformance: Array<{
    employeeId: number;
    employeeName: string;
    email: string;
    assignedConversations: number;
    messagesHandled: number;
  }>;
  labelBreakdown: Array<{
    labelName: string;
    count: number;
  }>;
  dailyTrend: Array<{
    date: string;
    messages: number;
    conversations: number;
  }>;
}

export const inboxReportService = {
  /**
   * Get comprehensive inbox report data
   */
  async getInboxReport(companyId: number, filters: InboxReportFilters = {}): Promise<InboxReportData> {
    try {
      // Parse date filters
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;

      // Build base where clause
      const baseWhere: any = { companyId };
      
      // Add date filter if provided
      if (startDate || endDate) {
        baseWhere.createdAt = {};
        if (startDate) {
          baseWhere.createdAt.gte = startDate;
        }
        if (endDate) {
          // Set end date to end of day
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          baseWhere.createdAt.lte = endOfDay;
        }
      }

      // Handle label filter - if labelName is provided, filter conversations that have this label
      let conversationIdsWithLabel: number[] | null = null;
      if (filters.labelName) {
        const conversationsWithLabel = await prisma.conversationLabel.findMany({
          where: {
            companyId,
            name: filters.labelName,
            ...(startDate || endDate ? {
              createdAt: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { 
                  lte: (() => {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    return end;
                  })()
                } : {}),
              }
            } : {}),
          },
          select: {
            conversationId: true,
          },
        });
        conversationIdsWithLabel = conversationsWithLabel.map((cl) => cl.conversationId);
        
        // If no conversations have this label, return empty results
        if (conversationIdsWithLabel.length === 0) {
          return {
            summary: {
              totalConversations: 0,
              totalUniqueUsers: 0,
              totalMessages: 0,
              openConversations: 0,
              closedConversations: 0,
            },
            employeePerformance: [],
            labelBreakdown: [],
            dailyTrend: [],
          };
        }
        
        baseWhere.id = { in: conversationIdsWithLabel };
      }

      // Get summary statistics
      const [totalConversations, openConversations, closedConversations] = await Promise.all([
        prisma.socialConversation.count({
          where: baseWhere,
        }),
        prisma.socialConversation.count({
          where: {
            ...baseWhere,
            status: 'Open',
          },
        }),
        prisma.socialConversation.count({
          where: {
            ...baseWhere,
            status: 'Closed',
          },
        }),
      ]);

      // Get unique users (distinct externalUserId)
      const uniqueUsersResult = await prisma.socialConversation.findMany({
        where: baseWhere,
        select: {
          externalUserId: true,
        },
        distinct: ['externalUserId'],
      });
      const totalUniqueUsers = uniqueUsersResult.length;

      // Get total messages count
      const conversationIds = await prisma.socialConversation.findMany({
        where: baseWhere,
        select: { id: true },
      });
      const conversationIdList = conversationIds.map((c) => c.id);
      
      const totalMessages = conversationIdList.length > 0
        ? await prisma.socialMessage.count({
            where: {
              conversationId: { in: conversationIdList },
              ...(startDate || endDate ? {
                createdAt: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { 
                    lte: (() => {
                      const end = new Date(endDate);
                      end.setHours(23, 59, 59, 999);
                      return end;
                    })()
                  } : {}),
                }
              } : {}),
            },
          })
        : 0;

      // Get employee performance
      const employeePerformance = await this.getEmployeePerformance(companyId, filters);

      // Get label breakdown
      const labelBreakdown = await this.getLabelStats(companyId, filters);

      // Get daily trend
      const dailyTrend = await this.getDailyTrend(companyId, filters);

      return {
        summary: {
          totalConversations,
          totalUniqueUsers,
          totalMessages,
          openConversations,
          closedConversations,
        },
        employeePerformance,
        labelBreakdown,
        dailyTrend,
      };
    } catch (error: any) {
      console.error('[Inbox Report Service] Error getting report:', error);
      throw new AppError(`Failed to generate inbox report: ${error.message}`, 500);
    }
  },

  /**
   * Get employee performance metrics
   */
  async getEmployeePerformance(companyId: number, filters: InboxReportFilters = {}): Promise<Array<{
    employeeId: number;
    employeeName: string;
    email: string;
    assignedConversations: number;
    messagesHandled: number;
  }>> {
    try {
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;

      // Build where clause for conversations
      const conversationWhere: any = {
        companyId,
        assignedTo: { not: null },
      };

      if (startDate || endDate) {
        conversationWhere.assignedAt = {};
        if (startDate) {
          conversationWhere.assignedAt.gte = startDate;
        }
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          conversationWhere.assignedAt.lte = endOfDay;
        }
      }

      // Handle label filter
      if (filters.labelName) {
        const conversationsWithLabel = await prisma.conversationLabel.findMany({
          where: {
            companyId,
            name: filters.labelName,
          },
          select: {
            conversationId: true,
          },
        });
        const conversationIds = conversationsWithLabel.map((cl) => cl.conversationId);
        if (conversationIds.length === 0) {
          return [];
        }
        conversationWhere.id = { in: conversationIds };
      }

      // Get employee assignment stats
      const employeeStats = await prisma.socialConversation.groupBy({
        by: ['assignedTo'],
        where: conversationWhere,
        _count: {
          id: true,
        },
      });

      if (employeeStats.length === 0) {
        return [];
      }

      // Get employee details
      const employeeIds = employeeStats.map((stat) => stat.assignedTo!);
      const employees = await prisma.employee.findMany({
        where: {
          id: { in: employeeIds },
          companyId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Get message counts per employee
      const employeePerformance = await Promise.all(
        employees.map(async (employee) => {
          const stat = employeeStats.find((s) => s.assignedTo === employee.id);
          const assignedConversations = stat?._count.id || 0;

          // Get conversations assigned to this employee
          const assignedConversationIds = await prisma.socialConversation.findMany({
            where: {
              ...conversationWhere,
              assignedTo: employee.id,
            },
            select: { id: true },
          });
          const conversationIdList = assignedConversationIds.map((c) => c.id);

          // Count messages in these conversations
          const messagesHandled = conversationIdList.length > 0
            ? await prisma.socialMessage.count({
                where: {
                  conversationId: { in: conversationIdList },
                  ...(startDate || endDate ? {
                    createdAt: {
                      ...(startDate ? { gte: startDate } : {}),
                      ...(endDate ? { 
                        lte: (() => {
                          const end = new Date(endDate);
                          end.setHours(23, 59, 59, 999);
                          return end;
                        })()
                      } : {}),
                    }
                  } : {}),
                },
              })
            : 0;

          return {
            employeeId: employee.id,
            employeeName: employee.user.name || employee.user.email,
            email: employee.user.email,
            assignedConversations,
            messagesHandled,
          };
        })
      );

      // Sort by assigned conversations (descending)
      return employeePerformance.sort((a, b) => b.assignedConversations - a.assignedConversations);
    } catch (error: any) {
      console.error('[Inbox Report Service] Error getting employee performance:', error);
      throw new AppError(`Failed to get employee performance: ${error.message}`, 500);
    }
  },

  /**
   * Get label statistics breakdown
   */
  async getLabelStats(companyId: number, filters: InboxReportFilters = {}): Promise<Array<{
    labelName: string;
    count: number;
  }>> {
    try {
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;

      const labelWhere: any = { companyId };
      
      if (startDate || endDate) {
        labelWhere.createdAt = {};
        if (startDate) {
          labelWhere.createdAt.gte = startDate;
        }
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          labelWhere.createdAt.lte = endOfDay;
        }
      }

      // If filtering by specific label, only return that label
      if (filters.labelName) {
        labelWhere.name = filters.labelName;
      }

      const labelStats = await prisma.conversationLabel.groupBy({
        by: ['name'],
        where: labelWhere,
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      });

      return labelStats.map((stat) => ({
        labelName: stat.name,
        count: stat._count.id,
      }));
    } catch (error: any) {
      console.error('[Inbox Report Service] Error getting label stats:', error);
      throw new AppError(`Failed to get label statistics: ${error.message}`, 500);
    }
  },

  /**
   * Get daily trend data
   */
  async getDailyTrend(companyId: number, filters: InboxReportFilters = {}): Promise<Array<{
    date: string;
    messages: number;
    conversations: number;
  }>> {
    try {
      // Default to last 30 days if no date range provided
      const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
      const startDate = filters.startDate 
        ? new Date(filters.startDate) 
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      // Set time to start/end of day
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      // Build conversation where clause
      const conversationWhere: any = {
        companyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };

      // Handle label filter
      if (filters.labelName) {
        const conversationsWithLabel = await prisma.conversationLabel.findMany({
          where: {
            companyId,
            name: filters.labelName,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            conversationId: true,
          },
        });
        const conversationIds = conversationsWithLabel.map((cl) => cl.conversationId);
        if (conversationIds.length === 0) {
          return [];
        }
        conversationWhere.id = { in: conversationIds };
      }

      // Get conversations grouped by date
      const conversations = await prisma.socialConversation.findMany({
        where: conversationWhere,
        select: {
          id: true,
          createdAt: true,
        },
      });

      // Get messages grouped by date
      const conversationIds = conversations.map((c) => c.id);
      const messages = conversationIds.length > 0
        ? await prisma.socialMessage.findMany({
            where: {
              conversationId: { in: conversationIds },
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            },
            select: {
              createdAt: true,
            },
          })
        : [];

      // Group by date
      const dateMap = new Map<string, { messages: number; conversations: number }>();

      // Initialize all dates in range
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateKey = currentDate.toISOString().split('T')[0];
        dateMap.set(dateKey, { messages: 0, conversations: 0 });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Count conversations by date
      conversations.forEach((conv) => {
        const dateKey = conv.createdAt.toISOString().split('T')[0];
        const existing = dateMap.get(dateKey) || { messages: 0, conversations: 0 };
        existing.conversations += 1;
        dateMap.set(dateKey, existing);
      });

      // Count messages by date
      messages.forEach((msg) => {
        const dateKey = msg.createdAt.toISOString().split('T')[0];
        const existing = dateMap.get(dateKey) || { messages: 0, conversations: 0 };
        existing.messages += 1;
        dateMap.set(dateKey, existing);
      });

      // Convert to array and sort by date
      const dailyTrend = Array.from(dateMap.entries())
        .map(([date, counts]) => ({
          date,
          messages: counts.messages,
          conversations: counts.conversations,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return dailyTrend;
    } catch (error: any) {
      console.error('[Inbox Report Service] Error getting daily trend:', error);
      throw new AppError(`Failed to get daily trend: ${error.message}`, 500);
    }
  },
};
