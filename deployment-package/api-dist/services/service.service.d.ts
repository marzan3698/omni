interface ServiceAttributes {
    keyValuePairs?: {
        [key: string]: string;
    };
    tags?: string[];
}
interface CreateServiceData {
    companyId: number;
    title: string;
    details: string;
    pricing: number;
    deliveryStartDate: Date;
    deliveryEndDate: Date;
    attributes: ServiceAttributes;
}
interface UpdateServiceData {
    title?: string;
    details?: string;
    pricing?: number;
    deliveryStartDate?: Date;
    deliveryEndDate?: Date;
    attributes?: ServiceAttributes;
    isActive?: boolean;
}
export declare const serviceService: {
    /**
     * Create a new service
     */
    createService(data: CreateServiceData): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
        title: string;
        deliveryStartDate: Date;
        deliveryEndDate: Date;
        details: string;
        pricing: import("@prisma/client/runtime/library.js").Decimal;
        attributes: import("@prisma/client/runtime/library.js").JsonValue;
    }>;
    /**
     * Get all services
     */
    getAllServices(companyId: number, filters?: {
        isActive?: boolean;
    }): Promise<({
        _count: {
            projects: number;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
        title: string;
        deliveryStartDate: Date;
        deliveryEndDate: Date;
        details: string;
        pricing: import("@prisma/client/runtime/library.js").Decimal;
        attributes: import("@prisma/client/runtime/library.js").JsonValue;
    })[]>;
    /**
     * Get service by ID
     */
    getServiceById(id: number, companyId: number): Promise<{
        projects: {
            status: import(".prisma/client").$Enums.ProjectStatus;
            id: number;
            createdAt: Date;
            title: string;
        }[];
        _count: {
            projects: number;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
        title: string;
        deliveryStartDate: Date;
        deliveryEndDate: Date;
        details: string;
        pricing: import("@prisma/client/runtime/library.js").Decimal;
        attributes: import("@prisma/client/runtime/library.js").JsonValue;
    }>;
    /**
     * Update service
     */
    updateService(id: number, companyId: number, data: UpdateServiceData): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
        title: string;
        deliveryStartDate: Date;
        deliveryEndDate: Date;
        details: string;
        pricing: import("@prisma/client/runtime/library.js").Decimal;
        attributes: import("@prisma/client/runtime/library.js").JsonValue;
    }>;
    /**
     * Delete service (soft delete if has projects, hard delete otherwise)
     */
    deleteService(id: number, companyId: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
        title: string;
        deliveryStartDate: Date;
        deliveryEndDate: Date;
        details: string;
        pricing: import("@prisma/client/runtime/library.js").Decimal;
        attributes: import("@prisma/client/runtime/library.js").JsonValue;
    }>;
};
export {};
//# sourceMappingURL=service.service.d.ts.map