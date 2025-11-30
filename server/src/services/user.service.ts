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
    profileImage?: string;
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
        profileImage: data.profileImage,
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
    email?: string;
    password?: string;
    roleId?: number;
    profileImage?: string;
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
    if (data.email) updateData.email = data.email;
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }
    if (data.roleId) updateData.roleId = data.roleId;
    if (data.profileImage !== undefined) updateData.profileImage = data.profileImage;

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
      },
    });

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

