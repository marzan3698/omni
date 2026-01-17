interface CreateEmployeeData {
    userId: string;
    companyId: number;
    department?: string;
    departmentId?: number;
    designation?: string;
    salary?: number;
    workHours?: number;
    holidays?: number;
    bonus?: number;
    responsibilities?: string;
    joinDate?: Date;
}
interface UpdateEmployeeData {
    department?: string;
    departmentId?: number;
    designation?: string;
    salary?: number;
    workHours?: number;
    holidays?: number;
    bonus?: number;
    responsibilities?: string;
    joinDate?: Date;
}
export declare const employeeService: {
    /**
     * Get all employees for a company
     */
    getAllEmployees(companyId: number): Promise<({
        user: {
            role: {
                id: number;
                name: string;
            };
            id: string;
            email: string;
            profileImage: string | null;
        };
        _count: {
            assignedLeads: number;
            assignedTasks: number;
        };
        departmentRelation: {
            id: number;
            name: string;
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
    })[]>;
    /**
     * Get employee by ID
     */
    getEmployeeById(id: number, companyId: number): Promise<{
        user: {
            role: {
                id: number;
                name: string;
                permissions: import("@prisma/client/runtime/library.js").JsonValue;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            name: string | null;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            phone: string | null;
            address: string | null;
            passwordHash: string;
            education: string | null;
            profileImage: string | null;
            eSignature: string | null;
            roleId: number;
            companyId: number;
        };
        departmentRelation: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: number;
            managerId: number | null;
        } | null;
        assignedLeads: {
            status: import(".prisma/client").$Enums.LeadStatus;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            phone: string | null;
            companyId: number;
            value: import("@prisma/client/runtime/library.js").Decimal | null;
            title: string;
            description: string | null;
            assignedTo: number | null;
            conversationId: number | null;
            createdBy: string;
            source: import(".prisma/client").$Enums.LeadSource;
            customerName: string | null;
            categoryId: number | null;
            interestId: number | null;
            campaignId: number | null;
            productId: number | null;
            purchasePrice: import("@prisma/client/runtime/library.js").Decimal | null;
            salePrice: import("@prisma/client/runtime/library.js").Decimal | null;
            profit: import("@prisma/client/runtime/library.js").Decimal | null;
        }[];
        assignedTasks: ({
            comments: ({
                user: {
                    id: string;
                    email: string;
                    profileImage: string | null;
                };
            } & {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                content: string;
                taskId: number;
            })[];
        } & {
            status: import(".prisma/client").$Enums.TaskStatus;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            companyId: number;
            title: string;
            description: string | null;
            priority: import(".prisma/client").$Enums.TaskPriority;
            dueDate: Date | null;
            projectId: number | null;
            assignedTo: number | null;
            groupId: number | null;
            startedAt: Date | null;
            progress: import("@prisma/client/runtime/library.js").Decimal | null;
            conversationId: number | null;
        })[];
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
    }>;
    /**
     * Create employee
     */
    createEmployee(data: CreateEmployeeData): Promise<{
        user: {
            role: {
                id: number;
                name: string;
            };
            id: string;
            email: string;
            profileImage: string | null;
        };
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
    }>;
    /**
     * Update employee
     */
    updateEmployee(id: number, companyId: number, data: UpdateEmployeeData): Promise<{
        user: {
            role: {
                id: number;
                name: string;
            };
            id: string;
            email: string;
            profileImage: string | null;
        };
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
    }>;
    /**
     * Delete employee
     */
    deleteEmployee(id: number, companyId: number): Promise<{
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
    }>;
    /**
     * Get employee tasks
     */
    getEmployeeTasks(employeeId: number, companyId: number): Promise<({
        comments: ({
            user: {
                id: string;
                email: string;
                profileImage: string | null;
            };
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            content: string;
            taskId: number;
        })[];
    } & {
        status: import(".prisma/client").$Enums.TaskStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string;
        description: string | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        dueDate: Date | null;
        projectId: number | null;
        assignedTo: number | null;
        groupId: number | null;
        startedAt: Date | null;
        progress: import("@prisma/client/runtime/library.js").Decimal | null;
        conversationId: number | null;
    })[]>;
    /**
     * Get employee performance stats
     */
    getEmployeePerformance(employeeId: number, companyId: number): Promise<{
        tasks: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.TaskGroupByOutputType, "status"[]> & {
            _count: number;
        })[];
        leads: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.LeadGroupByOutputType, "status"[]> & {
            _count: number;
            _sum: {
                value: import("@prisma/client/runtime/library.js").Decimal | null;
            };
        })[];
        totalTasks: number;
        totalLeads: number;
        totalLeadValue: number;
    }>;
};
export {};
//# sourceMappingURL=employee.service.d.ts.map