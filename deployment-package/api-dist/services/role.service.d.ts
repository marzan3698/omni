export declare const roleService: {
    /**
     * Get all roles
     */
    getAllRoles(): Promise<({
        _count: {
            users: number;
        };
    } & {
        id: number;
        name: string;
        permissions: import("@prisma/client/runtime/library.js").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    /**
     * Get role by ID
     */
    getRoleById(id: number): Promise<{
        _count: {
            users: number;
        };
    } & {
        id: number;
        name: string;
        permissions: import("@prisma/client/runtime/library.js").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Update role permissions
     */
    updateRolePermissions(id: number, permissions: Record<string, boolean>): Promise<{
        _count: {
            users: number;
        };
    } & {
        id: number;
        name: string;
        permissions: import("@prisma/client/runtime/library.js").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
};
//# sourceMappingURL=role.service.d.ts.map