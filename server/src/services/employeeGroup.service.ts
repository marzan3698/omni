import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

interface CreateGroupData {
  name: string;
  description: string;
  companyId: number;
  createdById: string;
  employeeIds: number[];
}

interface UpdateGroupData {
  name?: string;
  description?: string;
  employeeIds?: number[];
}

export const employeeGroupService = {
  /**
   * Get all employee groups for a company
   */
  async getAllGroups(companyId: number) {
    try {
      const groups = await prisma.employeeGroup.findMany({
        where: {
          companyId,
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
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
          _count: {
            select: {
              members: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return groups;
    } catch (error) {
      console.error('Error fetching employee groups:', error);
      throw new AppError('Failed to fetch employee groups', 500);
    }
  },

  /**
   * Get employee group by ID
   */
  async getGroupById(id: number, companyId: number) {
    const group = await prisma.employeeGroup.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
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
                  company: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
                designation: true,
                department: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!group) {
      throw new AppError('Employee group not found', 404);
    }

    return group;
  },

  /**
   * Create employee group
   */
  async createGroup(data: CreateGroupData) {
    // Validate company exists
    const company = await prisma.company.findUnique({
      where: { id: data.companyId },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    // Validate creator exists
    const creator = await prisma.user.findUnique({
      where: { id: data.createdById },
    });

    if (!creator) {
      throw new AppError('Creator user not found', 404);
    }

    // Validate employees exist and belong to the same company
    if (data.employeeIds && data.employeeIds.length > 0) {
      const employees = await prisma.employee.findMany({
        where: {
          id: { in: data.employeeIds },
          companyId: data.companyId,
        },
      });

      if (employees.length !== data.employeeIds.length) {
        throw new AppError('Some employees not found or do not belong to the company', 400);
      }
    }

    // Create group with members
    const group = await prisma.employeeGroup.create({
      data: {
        name: data.name,
        description: data.description,
        companyId: data.companyId,
        createdById: data.createdById,
        members: {
          create: data.employeeIds.map((employeeId) => ({
            employeeId,
          })),
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
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
        _count: {
          select: {
            members: true,
            // campaigns: true, // Temporarily disabled - campaign_groups table may not exist
          },
        },
      },
    });

    return group;
  },

  /**
   * Update employee group
   */
  async updateGroup(id: number, companyId: number, data: UpdateGroupData) {
    // Verify group exists and belongs to company
    const existingGroup = await prisma.employeeGroup.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!existingGroup) {
      throw new AppError('Employee group not found', 404);
    }

    // Update group basic info
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;

    // Handle employee membership updates
    if (data.employeeIds !== undefined) {
      // Delete existing members
      await prisma.employeeGroupMember.deleteMany({
        where: { groupId: id },
      });

      // Validate new employees exist and belong to the same company
      if (data.employeeIds.length > 0) {
        const employees = await prisma.employee.findMany({
          where: {
            id: { in: data.employeeIds },
            companyId: companyId,
          },
        });

        if (employees.length !== data.employeeIds.length) {
          throw new AppError('Some employees not found or do not belong to the company', 400);
        }

        // Create new member relationships
        await prisma.employeeGroupMember.createMany({
          data: data.employeeIds.map((employeeId) => ({
            groupId: id,
            employeeId,
          })),
          skipDuplicates: true,
        });
      }
    }

    // Update group if there are changes to name or description
    if (Object.keys(updateData).length > 0) {
      await prisma.employeeGroup.update({
        where: { id },
        data: updateData,
      });
    }

    // Return updated group
    return await this.getGroupById(id, companyId);
  },

  /**
   * Delete employee group
   */
  async deleteGroup(id: number, companyId: number) {
    // Verify group exists and belongs to company
    const group = await prisma.employeeGroup.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!group) {
      throw new AppError('Employee group not found', 404);
    }

    // Delete group (cascade will delete members and campaign assignments)
    await prisma.employeeGroup.delete({
      where: { id },
    });

    return { message: 'Employee group deleted successfully' };
  },

  /**
   * Get group members
   */
  async getGroupMembers(groupId: number, companyId: number) {
    // Verify group exists and belongs to company
    const group = await prisma.employeeGroup.findFirst({
      where: {
        id: groupId,
        companyId,
      },
    });

    if (!group) {
      throw new AppError('Employee group not found', 404);
    }

    const members = await prisma.employeeGroupMember.findMany({
      where: {
        groupId,
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                company: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            designation: true,
            department: true,
          },
        },
      },
    });

    return members.map((m) => m.employee);
  },
};

