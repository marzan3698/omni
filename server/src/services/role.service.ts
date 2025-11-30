import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const roleService = {
  /**
   * Get all roles
   */
  async getAllRoles() {
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    return roles;
  },

  /**
   * Get role by ID
   */
  async getRoleById(id: number) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!role) {
      throw new AppError('Role not found', 404);
    }

    return role;
  },

  /**
   * Update role permissions
   */
  async updateRolePermissions(id: number, permissions: Record<string, boolean>) {
    const role = await prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new AppError('Role not found', 404);
    }

    return await prisma.role.update({
      where: { id },
      data: {
        permissions: permissions as any,
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });
  },
};

