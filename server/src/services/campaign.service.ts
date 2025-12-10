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
  productIds?: number[];
  clientIds?: string[];
  employeeIds?: number[];
  groupIds?: number[];
}

interface UpdateCampaignData {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  type?: CampaignType;
  productIds?: number[];
  clientIds?: string[];
  employeeIds?: number[];
  groupIds?: number[];
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
        clients: {
          include: {
            client: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        employees: {
          include: {
            employee: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        groups: {
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
                            email: true,
                            name: true,
                          },
                        },
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

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        description: data.description && data.description.trim() ? data.description.trim() : null,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        budget: new Prisma.Decimal(data.budget),
        type: data.type,
      },
    });

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

    // Assign clients if provided
    if (data.clientIds && data.clientIds.length > 0) {
      // Validate clients exist and have Client role
      const clients = await prisma.user.findMany({
        where: {
          id: { in: data.clientIds },
          companyId: data.companyId,
          role: {
            name: 'Client',
          },
        },
      });

      if (clients.length !== data.clientIds.length) {
        throw new AppError('Some clients not found or are not valid clients', 400);
      }

      // Create campaign-client relationships
      await prisma.campaignClient.createMany({
        data: data.clientIds.map((clientId) => ({
          campaignId: campaign.id,
          clientId,
        })),
        skipDuplicates: true,
      });
    }

    // Assign employees if provided
    if (data.employeeIds && data.employeeIds.length > 0) {
      // Validate employees exist
      // Note: For SuperAdmin, we allow cross-company employee assignment
      // For regular users, employees should belong to the campaign's company
      const employees = await prisma.employee.findMany({
        where: {
          id: { in: data.employeeIds },
        },
        include: {
          user: {
            select: {
              companyId: true,
            },
          },
        },
      });

      if (employees.length !== data.employeeIds.length) {
        throw new AppError('Some employees not found', 400);
      }

      // Create campaign-employee relationships
      await prisma.campaignEmployee.createMany({
        data: data.employeeIds.map((employeeId) => ({
          campaignId: campaign.id,
          employeeId,
        })),
        skipDuplicates: true,
      });
    }

    // Assign employee groups if provided
    if (data.groupIds && data.groupIds.length > 0) {
      // Validate groups exist and belong to the same company
      const groups = await prisma.employeeGroup.findMany({
        where: {
          id: { in: data.groupIds },
          companyId: data.companyId,
        },
      });

      if (groups.length !== data.groupIds.length) {
        throw new AppError('Some employee groups not found or do not belong to the company', 400);
      }

      // Create campaign-group relationships (dynamic linking)
      await prisma.campaignGroup.createMany({
        data: data.groupIds.map((groupId) => ({
          campaignId: campaign.id,
          groupId,
        })),
        skipDuplicates: true,
      });
    }

    // Return campaign with products, clients, employees, groups, and leads
    return await prisma.campaign.findUnique({
      where: { id: campaign.id },
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
        clients: {
          include: {
            client: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        employees: {
          include: {
            employee: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        groups: {
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
                            email: true,
                            name: true,
                          },
                        },
                      },
                    },
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

    // Update employees if provided
    if (data.employeeIds !== undefined) {
      // Delete existing employee assignments
      await prisma.campaignEmployee.deleteMany({
        where: { campaignId: id },
      });

      // Add new employee assignments if any
      if (data.employeeIds.length > 0) {
        // Validate employees exist
        const employees = await prisma.employee.findMany({
          where: {
            id: { in: data.employeeIds },
          },
        });

        if (employees.length !== data.employeeIds.length) {
          throw new AppError('Some employees not found', 400);
        }

        // Create campaign-employee relationships
        await prisma.campaignEmployee.createMany({
          data: data.employeeIds.map((employeeId) => ({
            campaignId: id,
            employeeId,
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
        // Validate groups exist and belong to the same company
        const groups = await prisma.employeeGroup.findMany({
          where: {
            id: { in: data.groupIds },
            companyId: companyId,
          },
        });

        if (groups.length !== data.groupIds.length) {
          throw new AppError('Some employee groups not found or do not belong to the company', 400);
        }

        // Create campaign-group relationships (dynamic linking)
        await prisma.campaignGroup.createMany({
          data: data.groupIds.map((groupId) => ({
            campaignId: id,
            groupId,
          })),
          skipDuplicates: true,
        });
      }
    }

    // Return campaign with products, employees, groups, and leads
    return await prisma.campaign.findUnique({
      where: { id },
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
        employees: {
          include: {
            employee: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
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
              },
            },
          },
        },
        employees: {
          include: {
            employee: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                  },
                },
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
  async getCampaignClients(id: number, companyId: number) {
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
  async getCampaignProducts(campaignId: number, companyId: number) {
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
};

