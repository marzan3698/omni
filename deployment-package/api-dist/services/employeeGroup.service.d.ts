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
export declare const employeeGroupService: {
    /**
     * Get all employee groups for a company
     */
    getAllGroups(companyId: number): Promise<({
        _count: {
            members: number;
        };
        creator: {
            id: string;
            name: string | null;
            email: string;
        };
        members: ({
            employee: {
                user: {
                    id: string;
                    name: string | null;
                    email: string;
                };
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
            };
        } & {
            id: number;
            createdAt: Date;
            groupId: number;
            employeeId: number;
        })[];
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string;
        createdById: string;
    })[]>;
    /**
     * Get employee group by ID
     */
    getGroupById(id: number, companyId: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string;
        createdById: string;
    }>;
    /**
     * Create employee group
     */
    createGroup(data: CreateGroupData): Promise<{
        _count: {
            members: number;
        };
        creator: {
            id: string;
            name: string | null;
            email: string;
        };
        members: ({
            employee: {
                user: {
                    id: string;
                    name: string | null;
                    email: string;
                };
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
            };
        } & {
            id: number;
            createdAt: Date;
            groupId: number;
            employeeId: number;
        })[];
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string;
        createdById: string;
    }>;
    /**
     * Update employee group
     */
    updateGroup(id: number, companyId: number, data: UpdateGroupData): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        description: string;
        createdById: string;
    }>;
    /**
     * Delete employee group
     */
    deleteGroup(id: number, companyId: number): Promise<{
        message: string;
    }>;
    /**
     * Get group members
     */
    getGroupMembers(groupId: number, companyId: number): Promise<any[]>;
};
export {};
//# sourceMappingURL=employeeGroup.service.d.ts.map