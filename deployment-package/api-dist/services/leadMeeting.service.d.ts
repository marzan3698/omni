import { LeadMeetingStatus } from '@prisma/client';
interface CreateLeadMeetingData {
    companyId: number;
    leadId: number;
    clientId?: number;
    createdBy: string;
    title: string;
    description?: string;
    meetingTime: Date;
    durationMinutes: number;
    googleMeetUrl: string;
    status?: LeadMeetingStatus;
}
interface UpdateLeadMeetingData {
    title?: string;
    description?: string;
    meetingTime?: Date;
    durationMinutes?: number;
    googleMeetUrl?: string;
    status?: LeadMeetingStatus;
}
export declare const leadMeetingService: {
    getLeadMeetings(leadId: number, companyId: number): Promise<{
        status: import(".prisma/client").$Enums.LeadMeetingStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string;
        description: string | null;
        leadId: number;
        clientId: number | null;
        createdBy: string;
        durationMinutes: number;
        meetingTime: Date;
        googleMeetUrl: string;
    }[]>;
    createLeadMeeting(data: CreateLeadMeetingData): Promise<{
        status: import(".prisma/client").$Enums.LeadMeetingStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string;
        description: string | null;
        leadId: number;
        clientId: number | null;
        createdBy: string;
        durationMinutes: number;
        meetingTime: Date;
        googleMeetUrl: string;
    }>;
    updateLeadMeeting(id: number, leadId: number, companyId: number, data: UpdateLeadMeetingData): Promise<{
        status: import(".prisma/client").$Enums.LeadMeetingStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string;
        description: string | null;
        leadId: number;
        clientId: number | null;
        createdBy: string;
        durationMinutes: number;
        meetingTime: Date;
        googleMeetUrl: string;
    }>;
    deleteLeadMeeting(id: number, leadId: number, companyId: number): Promise<{
        status: import(".prisma/client").$Enums.LeadMeetingStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string;
        description: string | null;
        leadId: number;
        clientId: number | null;
        createdBy: string;
        durationMinutes: number;
        meetingTime: Date;
        googleMeetUrl: string;
    }>;
    /**
     * Get all meetings for a company with role-based filtering
     */
    getAllMeetings(companyId: number, userId?: string, userRole?: string, filters?: {
        status?: LeadMeetingStatus;
        startDate?: Date;
        endDate?: Date;
        leadId?: number;
    }): Promise<({
        client: {
            id: number;
            name: string;
        } | null;
        lead: {
            assignedEmployee: ({
                user: {
                    id: string;
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
            }) | null;
            createdByUser: {
                id: string;
                email: string;
                profileImage: string | null;
            };
        } & {
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
        };
    } & {
        status: import(".prisma/client").$Enums.LeadMeetingStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string;
        description: string | null;
        leadId: number;
        clientId: number | null;
        createdBy: string;
        durationMinutes: number;
        meetingTime: Date;
        googleMeetUrl: string;
    })[]>;
    /**
     * Get next upcoming meeting for a user (within 1 hour)
     */
    getUpcomingMeeting(userId: string, companyId: number): Promise<({
        lead: {
            id: number;
            title: string;
            assignedEmployee: ({
                user: {
                    id: string;
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
            }) | null;
            createdByUser: {
                id: string;
                email: string;
                profileImage: string | null;
            };
        };
    } & {
        status: import(".prisma/client").$Enums.LeadMeetingStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        title: string;
        description: string | null;
        leadId: number;
        clientId: number | null;
        createdBy: string;
        durationMinutes: number;
        meetingTime: Date;
        googleMeetUrl: string;
    }) | null>;
};
export {};
//# sourceMappingURL=leadMeeting.service.d.ts.map