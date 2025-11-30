import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

interface CreateEmployeeData {
  userId: string;
  companyId: number;
  department?: string;
  departmentId?: number;
  designation?: string;
  salary?: number;
  joinDate?: Date;
}

interface UpdateEmployeeData {
  department?: string;
  departmentId?: number;
  designation?: string;
  salary?: number;
  joinDate?: Date;
}

export const employeeService = {
  /**
   * Get all employees for a company
   */
  async getAllEmployees(companyId: number) {
    return await prisma.employee.findMany({
      where: { companyId },
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
        departmentRelation: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            assignedTasks: true,
            assignedLeads: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get employee by ID
   */
  async getEmployeeById(id: number, companyId: number) {
    const employee = await prisma.employee.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        user: {
          include: {
            role: true,
          },
        },
        departmentRelation: true,
        assignedTasks: {
          include: {
            comments: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    profileImage: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        assignedLeads: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    return employee;
  },

  /**
   * Create employee
   */
  async createEmployee(data: CreateEmployeeData) {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if employee already exists for this user
    const existingEmployee = await prisma.employee.findUnique({
      where: { userId: data.userId },
    });

    if (existingEmployee) {
      throw new AppError('Employee profile already exists for this user', 400);
    }

    return await prisma.employee.create({
      data: {
        userId: data.userId,
        companyId: data.companyId,
        department: data.department,
        departmentId: data.departmentId,
        designation: data.designation,
        salary: data.salary ? data.salary : undefined,
        joinDate: data.joinDate,
      },
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
        departmentRelation: true,
      },
    });
  },

  /**
   * Update employee
   */
  async updateEmployee(id: number, companyId: number, data: UpdateEmployeeData) {
    const employee = await prisma.employee.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    return await prisma.employee.update({
      where: { id },
      data,
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
        departmentRelation: true,
      },
    });
  },

  /**
   * Delete employee
   */
  async deleteEmployee(id: number, companyId: number) {
    const employee = await prisma.employee.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    return await prisma.employee.delete({
      where: { id },
    });
  },

  /**
   * Get employee tasks
   */
  async getEmployeeTasks(employeeId: number, companyId: number) {
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId,
      },
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    return await prisma.task.findMany({
      where: {
        assignedTo: employeeId,
        companyId,
      },
      include: {
        comments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get employee performance stats
   */
  async getEmployeePerformance(employeeId: number, companyId: number) {
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId,
      },
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    const [tasks, leads] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where: {
          assignedTo: employeeId,
          companyId,
        },
        _count: true,
      }),
      prisma.lead.groupBy({
        by: ['status'],
        where: {
          assignedTo: employeeId,
          companyId,
        },
        _count: true,
        _sum: {
          value: true,
        },
      }),
    ]);

    return {
      tasks,
      leads,
      totalTasks: tasks.reduce((sum, t) => sum + t._count, 0),
      totalLeads: leads.reduce((sum, l) => sum + l._count, 0),
      totalLeadValue: leads.reduce((sum, l) => sum + (Number(l._sum.value) || 0), 0),
    };
  },
};

