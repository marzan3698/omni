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
    async getRoleById(id) {
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
    async updateRolePermissions(id, permissions) {
        const role = await prisma.role.findUnique({
            where: { id },
        });
        if (!role) {
            throw new AppError('Role not found', 404);
        }
        return await prisma.role.update({
            where: { id },
            data: {
                permissions: permissions,
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
//# sourceMappingURL=role.service.js.map