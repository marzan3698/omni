import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import bcrypt from 'bcryptjs';

export const userService = {
  /**
   * Get all users (SuperAdmin only)
   */
  async getAllUsers(companyId?: number) {
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        employee: {
          select: {
            id: true,
            designation: true,
            department: true,
            salary: true,
            workHours: true,
            holidays: true,
            bonus: true,
            responsibilities: true,
            joinDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map(user => ({
      ...user,
      passwordHash: undefined, // Remove password hash from response
    }));
  },

  /**
   * Get user by ID
   */
  async getUserById(id: string, companyId?: number) {
    const where: any = { id };
    if (companyId) {
      where.companyId = companyId;
    }

    const user = await prisma.user.findFirst({
      where,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        employee: {
          select: {
            id: true,
            designation: true,
            department: true,
            salary: true,
            workHours: true,
            holidays: true,
            bonus: true,
            responsibilities: true,
            joinDate: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  /**
   * Create user (SuperAdmin only)
   */
  async createUser(data: {
    email: string;
    password: string;
    roleId: number;
    companyId: number;
    name?: string | null;
    phone?: string | null;
    address?: string | null;
    education?: string | null;
    profileImage?: string | null;
    eSignature?: string | null;
  }) {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        companyId: data.companyId,
      },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists in this company', 400);
    }

    // Verify role exists
    const role = await prisma.role.findUnique({
      where: { id: data.roleId },
    });

    if (!role) {
      throw new AppError('Role not found', 404);
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: data.companyId },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        roleId: data.roleId,
        companyId: data.companyId,
        name: data.name || null,
        phone: data.phone || null,
        address: data.address || null,
        education: data.education || null,
        profileImage: data.profileImage || null,
        eSignature: data.eSignature || null,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  /**
   * Update user (SuperAdmin only)
   */
  async updateUser(id: string, data: {
    name?: string | null;
    email?: string;
    phone?: string | null;
    password?: string;
    address?: string | null;
    education?: string | null;
    roleId?: number;
    companyId?: number;
    profileImage?: string | null;
    eSignature?: string | null;
    // Employee fields
    designation?: string | null;
    department?: string | null;
    salary?: number | null;
    workHours?: number | null;
    holidays?: number | null;
    bonus?: number | null;
    responsibilities?: string | null;
  }, companyId?: number) {
    const where: any = { id };
    if (companyId) {
      where.companyId = companyId;
    }

    const existingUser = await prisma.user.findFirst({ where });

    if (!existingUser) {
      throw new AppError('User not found', 404);
    }

    // Check email uniqueness if email is being updated
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: data.email,
          companyId: existingUser.companyId,
        },
      });

      if (emailExists) {
        throw new AppError('User with this email already exists in this company', 400);
      }
    }

    // Verify role if being updated
    if (data.roleId) {
      const role = await prisma.role.findUnique({
        where: { id: data.roleId },
      });

      if (!role) {
        throw new AppError('Role not found', 404);
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name || null;
    if (data.email) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.education !== undefined) updateData.education = data.education || null;
    if (data.roleId) updateData.roleId = data.roleId;
    if (data.companyId) updateData.companyId = data.companyId;
    if (data.profileImage !== undefined) updateData.profileImage = data.profileImage || null;
    if (data.eSignature !== undefined) updateData.eSignature = data.eSignature || null;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        employee: {
          select: {
            id: true,
            designation: true,
            department: true,
            salary: true,
            workHours: true,
            holidays: true,
            bonus: true,
            responsibilities: true,
            joinDate: true,
          },
        },
      },
    });

    // Update or create employee record if employee fields are provided
    const finalCompanyId = data.companyId || existingUser.companyId;
    if (data.designation !== undefined || data.department !== undefined || 
        data.salary !== undefined || data.workHours !== undefined || 
        data.holidays !== undefined || data.bonus !== undefined || 
        data.responsibilities !== undefined) {
      
      const existingEmployee = await prisma.employee.findUnique({
        where: { userId: id },
      });

      const employeeData: any = {};
      if (data.designation !== undefined) employeeData.designation = data.designation || null;
      if (data.department !== undefined) employeeData.department = data.department || null;
      if (data.salary !== undefined) employeeData.salary = data.salary || null;
      if (data.workHours !== undefined) employeeData.workHours = data.workHours || null;
      if (data.holidays !== undefined) employeeData.holidays = data.holidays || null;
      if (data.bonus !== undefined) employeeData.bonus = data.bonus || null;
      if (data.responsibilities !== undefined) employeeData.responsibilities = data.responsibilities || null;

      if (existingEmployee) {
        await prisma.employee.update({
          where: { userId: id },
          data: employeeData,
        });
      } else {
        await prisma.employee.create({
          data: {
            userId: id,
            companyId: finalCompanyId,
            ...employeeData,
          },
        });
      }

      // Refetch user with updated employee data
      const updatedUser = await prisma.user.findUnique({
        where: { id },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              permissions: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          employee: {
            select: {
              id: true,
              designation: true,
              department: true,
              salary: true,
              workHours: true,
              holidays: true,
              bonus: true,
              responsibilities: true,
              joinDate: true,
            },
          },
        },
      });
      
      if (updatedUser) {
        const { passwordHash: _, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
      }
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  /**
   * Delete user (SuperAdmin only)
   */
  async deleteUser(id: string, companyId?: number) {
    const where: any = { id };
    if (companyId) {
      where.companyId = companyId;
    }

    const user = await prisma.user.findFirst({ where });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    await prisma.user.delete({
      where: { id },
    });

    return { success: true };
  },
};

