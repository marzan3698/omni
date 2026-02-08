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

  /**
   * Create a new role
   */
  async createRole(name: string, permissions: Record<string, boolean>) {
    // Validate name
    if (!name || name.trim().length === 0) {
      throw new AppError('Role name is required', 400);
    }

    if (name.length > 50) {
      throw new AppError('Role name must be 50 characters or less', 400);
    }

    const trimmedName = name.trim();

    // Check if role name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: trimmedName },
    });

    if (existingRole) {
      throw new AppError('Role name already exists', 400);
    }

    // Create role with provided permissions
    const role = await prisma.role.create({
      data: {
        name: trimmedName,
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

    return role;
  },

  /**
   * Update role name
   */
  async updateRoleName(id: number, name: string) {
    // Validate name
    if (!name || name.trim().length === 0) {
      throw new AppError('Role name is required', 400);
    }

    if (name.length > 50) {
      throw new AppError('Role name must be 50 characters or less', 400);
    }

    const trimmedName = name.trim();

    // Get existing role
    const role = await prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new AppError('Role not found', 404);
    }

    // Cannot rename SuperAdmin or Lead Manager role
    if (role.name === 'SuperAdmin') {
      throw new AppError('Cannot rename SuperAdmin role', 403);
    }
    if (role.name === 'Lead Manager') {
      throw new AppError('Cannot rename Lead Manager role', 403);
    }

    // Check if new name already exists (excluding current role)
    if (trimmedName !== role.name) {
      const existingRole = await prisma.role.findUnique({
        where: { name: trimmedName },
      });

      if (existingRole) {
        throw new AppError('Role name already exists', 400);
      }
    }

    // Update role name
    return await prisma.role.update({
      where: { id },
      data: {
        name: trimmedName,
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

  /**
   * Delete a role
   */
  async deleteRole(id: number) {
    // Get role with user count
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

    // Cannot delete SuperAdmin or Lead Manager role
    if (role.name === 'SuperAdmin') {
      throw new AppError('Cannot delete SuperAdmin role', 403);
    }
    if (role.name === 'Lead Manager') {
      throw new AppError('Cannot delete Lead Manager role', 403);
    }

    // Cannot delete if users are assigned
    if (role._count.users > 0) {
      throw new AppError(
        `Cannot delete role. ${role._count.users} user(s) are assigned to this role. Please reassign users before deleting.`,
        400
      );
    }

    // Delete role
    await prisma.role.delete({
      where: { id },
    });

    return { success: true, message: 'Role deleted successfully' };
  },
};

