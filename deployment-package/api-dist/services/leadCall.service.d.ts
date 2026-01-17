import { LeadCallStatus } from '@prisma/client';
interface CreateLeadCallData {
    companyId: number;
    leadId: number;
    clientId?: number;
    assignedTo: number;
    createdBy: string;
    title?: string;
    phoneNumber?: string;
    callTime: Date;
    durationMinutes?: number;
    status?: LeadCallStatus;
}
interface UpdateLeadCallData {
    title?: string;
    phoneNumber?: string;
    callTime?: Date;
    durationMinutes?: number;
    status?: LeadCallStatus;
    assignedTo?: number;
}
export declare const leadCallService: {
    getLeadCalls(leadId: number, companyId: number): Promise<({
        assignedEmployee: {
            user: {
                id: string;
                name: string | null;
                email: string;
                profileImage: string | null;
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
        status: import(".prisma/client").$Enums.LeadCallStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string | null;
        assignedTo: number;
        leadId: number;
        clientId: number | null;
        createdBy: string;
        phoneNumber: string | null;
        callTime: Date;
        durationMinutes: number | null;
        notes: string | null;
    })[]>;
    createLeadCall(data: CreateLeadCallData): Promise<{
        assignedEmployee: {
            user: {
                id: string;
                name: string | null;
                email: string;
                profileImage: string | null;
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
        status: import(".prisma/client").$Enums.LeadCallStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string | null;
        assignedTo: number;
        leadId: number;
        clientId: number | null;
        createdBy: string;
        phoneNumber: string | null;
        callTime: Date;
        durationMinutes: number | null;
        notes: string | null;
    }>;
    updateLeadCall(id: number, leadId: number, companyId: number, data: UpdateLeadCallData): Promise<{
        assignedEmployee: {
            user: {
                id: string;
                name: string | null;
                email: string;
                profileImage: string | null;
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
        status: import(".prisma/client").$Enums.LeadCallStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string | null;
        assignedTo: number;
        leadId: number;
        clientId: number | null;
        createdBy: string;
        phoneNumber: string | null;
        callTime: Date;
        durationMinutes: number | null;
        notes: string | null;
    }>;
    deleteLeadCall(id: number, leadId: number, companyId: number): Promise<{
        status: import(".prisma/client").$Enums.LeadCallStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string | null;
        assignedTo: number;
        leadId: number;
        clientId: number | null;
        createdBy: string;
        phoneNumber: string | null;
        callTime: Date;
        durationMinutes: number | null;
        notes: string | null;
    }>;
    addCallNote(id: number, leadId: number, companyId: number, note: string): Promise<{
        assignedEmployee: {
            user: {
                id: string;
                name: string | null;
                email: string;
                profileImage: string | null;
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
        status: import(".prisma/client").$Enums.LeadCallStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string | null;
        assignedTo: number;
        leadId: number;
        clientId: number | null;
        createdBy: string;
        phoneNumber: string | null;
        callTime: Date;
        durationMinutes: number | null;
        notes: string | null;
    }>;
    /**
     * Get all calls for a company with role-based filtering
     */
    getAllCalls(companyId: number, userId?: string, userRole?: string, filters?: {
        status?: LeadCallStatus;
        startDate?: Date;
        endDate?: Date;
        leadId?: number;
        assignedTo?: number;
    }): Promise<({
        client: {
            id: number;
            name: string;
        } | null;
        lead: {
            id: number;
            phone: string | null;
            title: string;
        };
        assignedEmployee: {
            user: {
                id: string;
                name: string | null;
                email: string;
                profileImage: string | null;
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
        status: import(".prisma/client").$Enums.LeadCallStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string | null;
        assignedTo: number;
        leadId: number;
        clientId: number | null;
        createdBy: string;
        phoneNumber: string | null;
        callTime: Date;
        durationMinutes: number | null;
        notes: string | null;
    })[]>;
    /**
     * Get upcoming calls for an assigned employee
     */
    getUpcomingCalls(userId: string, companyId: number): Promise<({
        client: {
            id: number;
            name: string;
        } | null;
        lead: {
            id: number;
            phone: string | null;
            title: string;
        };
    } & {
        status: import(".prisma/client").$Enums.LeadCallStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string | null;
        assignedTo: number;
        leadId: number;
        clientId: number | null;
        createdBy: string;
        phoneNumber: string | null;
        callTime: Date;
        durationMinutes: number | null;
        notes: string | null;
    })[]>;
};
export {};
//# sourceMappingURL=leadCall.service.d.ts.map