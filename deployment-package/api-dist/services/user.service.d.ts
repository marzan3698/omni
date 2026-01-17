export declare const userService: {
    /**
     * Get all users (SuperAdmin only)
     */
    getAllUsers(companyId?: number): Promise<{
        passwordHash: undefined;
        company: {
            id: number;
            name: string;
        };
        role: {
            id: number;
            name: string;
            permissions: import("@prisma/client/runtime/library.js").JsonValue;
        };
        employee: {
            department: string | null;
            id: number;
            designation: string | null;
            salary: import("@prisma/client/runtime/library.js").Decimal | null;
            workHours: import("@prisma/client/runtime/library.js").Decimal | null;
            holidays: number | null;
            bonus: import("@prisma/client/runtime/library.js").Decimal | null;
            responsibilities: string | null;
            joinDate: Date | null;
        } | null;
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        phone: string | null;
        address: string | null;
        education: string | null;
        profileImage: string | null;
        eSignature: string | null;
        roleId: number;
        companyId: number;
    }[]>;
    /**
     * Get user by ID
     */
    getUserById(id: string, companyId?: number): Promise<{
        company: {
            id: number;
            name: string;
        };
        role: {
            id: number;
            name: string;
            permissions: import("@prisma/client/runtime/library.js").JsonValue;
        };
        employee: {
            department: string | null;
            id: number;
            designation: string | null;
            salary: import("@prisma/client/runtime/library.js").Decimal | null;
            workHours: import("@prisma/client/runtime/library.js").Decimal | null;
            holidays: number | null;
            bonus: import("@prisma/client/runtime/library.js").Decimal | null;
            responsibilities: string | null;
            joinDate: Date | null;
        } | null;
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        phone: string | null;
        address: string | null;
        education: string | null;
        profileImage: string | null;
        eSignature: string | null;
        roleId: number;
        companyId: number;
    }>;
    /**
     * Create user (SuperAdmin only)
     */
    createUser(data: {
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
    }): Promise<{
        company: {
            id: number;
            name: string;
        };
        role: {
            id: number;
            name: string;
            permissions: import("@prisma/client/runtime/library.js").JsonValue;
        };
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        phone: string | null;
        address: string | null;
        education: string | null;
        profileImage: string | null;
        eSignature: string | null;
        roleId: number;
        companyId: number;
    }>;
    /**
     * Update user (SuperAdmin only)
     */
    updateUser(id: string, data: {
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
        designation?: string | null;
        department?: string | null;
        salary?: number | null;
        workHours?: number | null;
        holidays?: number | null;
        bonus?: number | null;
        responsibilities?: string | null;
    }, companyId?: number): Promise<{
        company: {
            id: number;
            name: string;
        };
        role: {
            id: number;
            name: string;
            permissions: import("@prisma/client/runtime/library.js").JsonValue;
        };
        employee: {
            department: string | null;
            id: number;
            designation: string | null;
            salary: import("@prisma/client/runtime/library.js").Decimal | null;
            workHours: import("@prisma/client/runtime/library.js").Decimal | null;
            holidays: number | null;
            bonus: import("@prisma/client/runtime/library.js").Decimal | null;
            responsibilities: string | null;
            joinDate: Date | null;
        } | null;
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        phone: string | null;
        address: string | null;
        education: string | null;
        profileImage: string | null;
        eSignature: string | null;
        roleId: number;
        companyId: number;
    }>;
    /**
     * Delete user (SuperAdmin only)
     */
    deleteUser(id: string, companyId?: number): Promise<{
        success: boolean;
    }>;
};
//# sourceMappingURL=user.service.d.ts.map