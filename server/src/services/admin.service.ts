import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { ProjectStatus } from '@prisma/client';

interface UpdateProjectData {
  title?: string;
  description?: string;
  budget?: number;
  deliveryStartDate?: Date;
  deliveryEndDate?: Date;
  time?: string;
  status?: ProjectStatus;
}

interface UpdateClientData {
  name?: string;
  contactInfo?: any;
  address?: string;
}

export const adminService = {
  /**
   * Get all projects across all companies (SuperAdmin only)
   */
  async getAllProjects(filters?: {
    companyId?: number;
    status?: ProjectStatus;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    return await prisma.project.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            email: true,
          },
        },
        service: {
          select: {
            id: true,
            title: true,
            pricing: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get all clients across all companies (SuperAdmin only)
   */
  async getAllClients(filters?: {
    companyId?: number;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters?.search) {
      // Simple name search - JSON search is complex, so we'll search by name
      where.name = { contains: filters.search };
    }

    return await prisma.client.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            invoices: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Update project (SuperAdmin/Admin)
   */
  async updateProject(id: number, data: UpdateProjectData) {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        budget: data.budget,
        deliveryStartDate: data.deliveryStartDate,
        deliveryEndDate: data.deliveryEndDate,
        time: data.time,
        status: data.status,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            email: true,
          },
        },
        service: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return updatedProject;
  },

  /**
   * Delete project (SuperAdmin/Admin)
   */
  async deleteProject(id: number) {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    return await prisma.project.delete({
      where: { id },
    });
  },

  /**
   * Update client (SuperAdmin/Admin)
   */
  async updateClient(id: number, data: UpdateClientData) {
    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name: data.name,
        contactInfo: data.contactInfo,
        address: data.address,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            invoices: true,
          },
        },
      },
    });

    return updatedClient;
  },

  /**
   * Delete client (SuperAdmin/Admin)
   */
  async deleteClient(id: number) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            invoices: true,
          },
        },
      },
    });

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    // Check if client has invoices
    if (client._count.invoices > 0) {
      throw new AppError('Cannot delete client with existing invoices', 400);
    }

    return await prisma.client.delete({
      where: { id },
    });
  },

  /**
   * Get client by ID with all related data (SuperAdmin only)
   */
  async getClientById(id: number) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        invoices: {
          include: {
            campaigns: {
              include: {
                campaign: {
                  include: {
                    leads: {
                      include: {
                        assignments: {
                          include: {
                            employee: {
                              include: {
                                user: {
                                  select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                  },
                                },
                              },
                            },
                          },
                        },
                        category: true,
                        interest: true,
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
                                        name: true,
                                        email: true,
                                        phone: true,
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
                    project: {
                      select: {
                        id: true,
                        title: true,
                        status: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    // Transform data to organize campaigns, leads, and employees
    const campaignsMap = new Map();
    const employeeGroupsMap = new Map();
    const employeesMap = new Map();

    // Process invoices and extract campaigns
    client.invoices.forEach((invoice) => {
      invoice.campaigns.forEach((campaignInvoice) => {
        const campaign = campaignInvoice.campaign;
        const campaignId = campaign.id;

        if (!campaignsMap.has(campaignId)) {
          campaignsMap.set(campaignId, {
            id: campaign.id,
            name: campaign.name,
            description: campaign.description,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
            budget: campaign.budget,
            type: campaign.type,
            isActive: campaign.isActive,
            project: campaign.project,
            leads: [],
            employeeGroups: [],
          });
        }

        const campaignData = campaignsMap.get(campaignId);

        // Add leads
        campaign.leads.forEach((lead) => {
          if (!campaignData.leads.find((l: any) => l.id === lead.id)) {
            campaignData.leads.push(lead);
          }
        });

        // Add employee groups
        campaign.groups.forEach((campaignGroup) => {
          const group = campaignGroup.group;
          const groupId = group.id;

          if (!campaignData.employeeGroups.find((g: any) => g.id === groupId)) {
            campaignData.employeeGroups.push({
              id: group.id,
              name: group.name,
              description: group.description,
            });
          }

          // Track employee groups globally
          if (!employeeGroupsMap.has(groupId)) {
            employeeGroupsMap.set(groupId, {
              id: group.id,
              name: group.name,
              description: group.description,
              members: [],
            });
          }

          // Add group members
          group.members.forEach((member) => {
            const employee = member.employee;
            const employeeId = employee.id;

            if (!employeesMap.has(employeeId)) {
              employeesMap.set(employeeId, {
                id: employee.id,
                userId: employee.userId,
                designation: employee.designation,
                department: employee.department,
                user: employee.user,
                groups: [],
              });
            }

            const employeeData = employeesMap.get(employeeId);
            if (!employeeData.groups.find((g: any) => g.id === groupId)) {
              employeeData.groups.push({
                id: group.id,
                name: group.name,
              });
            }

            const groupData = employeeGroupsMap.get(groupId);
            if (!groupData.members.find((m: any) => m.id === employeeId)) {
              groupData.members.push(employeeData);
            }
          });
        });
      });
    });

    // Convert maps to arrays
    const campaigns = Array.from(campaignsMap.values());
    const employeeGroups = Array.from(employeeGroupsMap.values());
    const employees = Array.from(employeesMap.values());

    // Calculate totals
    const totalLeads = campaigns.reduce((sum, c) => sum + c.leads.length, 0);
    const totalEmployees = employees.length;

    return {
      id: client.id,
      name: client.name,
      contactInfo: client.contactInfo,
      address: client.address,
      company: client.company,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      invoices: client.invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        totalAmount: inv.totalAmount,
        status: inv.status,
        notes: inv.notes,
      })),
      campaigns,
      employeeGroups,
      employees,
      stats: {
        totalInvoices: client.invoices.length,
        totalCampaigns: campaigns.length,
        totalLeads,
        totalEmployees,
      },
    };
  },

  /**
   * Get project by ID with all related data (SuperAdmin only)
   */
  async getProjectById(id: number) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        service: {
          select: {
            id: true,
            title: true,
            details: true,
            pricing: true,
            deliveryStartDate: true,
            deliveryEndDate: true,
          },
        },
        invoices: {
          include: {
            items: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          include: {
            paymentGateway: {
              select: {
                id: true,
                name: true,
                accountType: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        campaigns: {
          include: {
            leads: {
              include: {
                assignments: {
                  include: {
                    employee: {
                      include: {
                        user: {
                          select: {
                            id: true,
                            name: true,
                            email: true,
                          },
                        },
                      },
                    },
                  },
                },
                category: true,
                interest: true,
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
                                name: true,
                                email: true,
                                phone: true,
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
            products: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    salePrice: true,
                    currency: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Calculate stats
    const totalLeads = project.campaigns.reduce((sum, campaign) => sum + campaign.leads.length, 0);
    const totalEmployees = new Set(
      project.campaigns.flatMap((campaign) =>
        campaign.groups.flatMap((cg) =>
          cg.group.members.map((member) => member.employee.id)
        )
      )
    ).size;

    return {
      id: project.id,
      title: project.title,
      description: project.description,
      budget: project.budget,
      time: project.time,
      status: project.status,
      deliveryStartDate: project.deliveryStartDate,
      deliveryEndDate: project.deliveryEndDate,
      signature: project.signature,
      signedAt: project.signedAt,
      documentUrl: project.documentUrl,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      company: project.company,
      client: project.client,
      service: project.service,
      invoices: project.invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        totalAmount: inv.totalAmount,
        status: inv.status,
        notes: inv.notes,
        items: inv.items,
      })),
      payments: project.payments.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        transactionId: payment.transactionId,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        paidBy: payment.paidBy,
        paidAt: payment.paidAt,
        verifiedAt: payment.verifiedAt,
        notes: payment.notes,
        adminNotes: payment.adminNotes,
        paymentGateway: payment.paymentGateway,
      })),
      campaigns: project.campaigns.map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        budget: campaign.budget,
        type: campaign.type,
        isActive: campaign.isActive,
        leads: campaign.leads,
        employeeGroups: campaign.groups.map((cg) => ({
          id: cg.group.id,
          name: cg.group.name,
          description: cg.group.description,
          members: cg.group.members.map((member) => ({
            id: member.employee.id,
            userId: member.employee.userId,
            designation: member.employee.designation,
            department: member.employee.department,
            user: member.employee.user,
          })),
        })),
        products: campaign.products.map((cp) => cp.product),
      })),
      stats: {
        totalInvoices: project.invoices.length,
        totalPayments: project.payments.length,
        totalCampaigns: project.campaigns.length,
        totalLeads,
        totalEmployees,
      },
    };
  },
};

