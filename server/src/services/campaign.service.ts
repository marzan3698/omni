import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { CampaignType, Prisma } from '@prisma/client';

interface CreateCampaignData {
  companyId: number;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  budget: number;
  type: CampaignType;
}

interface UpdateCampaignData {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  type?: CampaignType;
}

export const campaignService = {
  /**
   * Get all campaigns for a company
   */
  async getAllCampaigns(companyId: number, filters?: {
    type?: CampaignType;
    active?: boolean;
  }) {
    const where: any = { companyId };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.active !== undefined) {
      const now = new Date();
      if (filters.active) {
        // Active campaigns: startDate <= now <= endDate
        where.startDate = { lte: now };
        where.endDate = { gte: now };
      } else {
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
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw new AppError('Failed to fetch campaigns', 500);
    }
  },

  /**
   * Get campaign by ID
   */
  async getCampaignById(id: number, companyId: number) {
    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
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
  async createCampaign(data: CreateCampaignData) {
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

    return await prisma.campaign.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        description: data.description && data.description.trim() ? data.description.trim() : null,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        budget: new Prisma.Decimal(data.budget),
        type: data.type,
      },
      include: {
        leads: {
          select: {
            id: true,
            value: true,
          },
        },
      },
    });
  },

  /**
   * Update campaign
   */
  async updateCampaign(id: number, companyId: number, data: UpdateCampaignData) {
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
    } else if (data.startDate) {
      const endDate = campaign.endDate;
      if (new Date(data.startDate) >= endDate) {
        throw new AppError('End date must be after start date', 400);
      }
    } else if (data.endDate) {
      const startDate = campaign.startDate;
      if (startDate >= new Date(data.endDate)) {
        throw new AppError('End date must be after start date', 400);
      }
    }

    // Validate budget
    if (data.budget !== undefined && data.budget <= 0) {
      throw new AppError('Budget must be greater than 0', 400);
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) {
      updateData.description = data.description && data.description.trim() ? data.description.trim() : null;
    }
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.budget !== undefined) updateData.budget = new Prisma.Decimal(data.budget);
    if (data.type !== undefined) updateData.type = data.type;

    return await prisma.campaign.update({
      where: { id },
      data: updateData,
      include: {
        leads: {
          select: {
            id: true,
            value: true,
          },
        },
      },
    });
  },

  /**
   * Delete campaign
   */
  async deleteCampaign(id: number, companyId: number) {
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
      throw new AppError(
        'Cannot delete campaign with associated leads. Please remove leads first.',
        400,
      );
    }

    return await prisma.campaign.delete({
      where: { id },
    });
  },

  /**
   * Get campaign statistics
   */
  async getCampaignStatistics(id: number, companyId: number) {
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

    const progressPercentage =
      Number(campaign.budget) > 0
        ? (totalEstimatedValue / Number(campaign.budget)) * 100
        : 0;

    const leadsByStatus = campaign.leads.reduce((acc, lead) => {
      const status = lead.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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
  async getActiveCampaigns(companyId: number) {
    const now = new Date();
    return await prisma.campaign.findMany({
      where: {
        companyId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        leads: {
          select: {
            id: true,
            value: true,
          },
        },
      },
    });
  },
};

