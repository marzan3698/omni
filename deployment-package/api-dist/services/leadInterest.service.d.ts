export declare const leadInterestService: {
    createInterest(companyId: number, data: {
        name: string;
        isActive?: boolean;
    }): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
    }>;
    getInterests(companyId: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
    }[]>;
    getAllInterests(): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
    }[]>;
    getInterestById(id: number, companyId: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
    }>;
    updateInterest(id: number, companyId: number, data: {
        name?: string;
        isActive?: boolean;
    }): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        companyId: number;
    }>;
    deleteInterest(id: number, companyId: number): Promise<{
        success: boolean;
    }>;
};
//# sourceMappingURL=leadInterest.service.d.ts.map