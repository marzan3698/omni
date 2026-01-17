interface RegisterData {
    email: string;
    password: string;
    roleId?: number;
    companyId: number;
}
interface RegisterClientData {
    email: string;
    password: string;
}
interface LoginData {
    email: string;
    password: string;
}
interface TokenPayload {
    id: string;
    email: string;
    roleId: number;
    companyId: number;
}
export declare const authService: {
    /**
     * Register a new user
     */
    register(data: RegisterData): Promise<{
        user: {
            id: string;
            email: string;
            roleId: number;
            roleName: string;
            profileImage: string | null;
            createdAt: Date;
        };
        token: string;
    }>;
    /**
     * Register a new client
     */
    registerClient(data: RegisterClientData): Promise<{
        user: {
            id: string;
            email: string;
            roleId: number;
            roleName: string;
            profileImage: string | null;
            createdAt: Date;
        };
        token: string;
    }>;
    /**
     * Login user
     */
    login(data: LoginData): Promise<{
        user: {
            id: string;
            email: string;
            roleId: number;
            companyId: number;
            roleName: string;
            permissions: import("@prisma/client/runtime/library.js").JsonValue;
            profileImage: string | null;
            createdAt: Date;
        };
        token: string;
    }>;
    /**
     * Get current user profile
     */
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        roleId: number;
        companyId: number;
        roleName: string;
        permissions: Record<string, boolean>;
        profileImage: string | null;
        employee: ({
            departmentRelation: {
                id: number;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                companyId: number;
                managerId: number | null;
            } | null;
        } & {
            department: string | null;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            companyId: number;
            userId: string;
            departmentId: number | null;
            designation: string | null;
            salary: import("@prisma/client/runtime/library.js").Decimal | null;
            workHours: import("@prisma/client/runtime/library.js").Decimal | null;
            holidays: number | null;
            bonus: import("@prisma/client/runtime/library.js").Decimal | null;
            responsibilities: string | null;
            joinDate: Date | null;
        }) | null;
        createdAt: Date;
    }>;
    /**
     * Generate JWT token
     */
    generateToken(payload: TokenPayload): string;
    /**
     * Verify JWT token
     */
    verifyToken(token: string): TokenPayload;
};
export {};
//# sourceMappingURL=auth.service.d.ts.map