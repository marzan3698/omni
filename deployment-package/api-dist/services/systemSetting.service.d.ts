export declare const systemSettingService: {
    /**
     * Create or update system setting
     */
    upsertSetting(companyId: number, key: string, value: string, description?: string): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        value: string;
        description: string | null;
        key: string;
    }>;
    /**
     * Get all system settings for a company
     */
    getSettings(companyId: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        value: string;
        description: string | null;
        key: string;
    }[]>;
    /**
     * Get setting by key
     */
    getSettingByKey(companyId: number, key: string): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        value: string;
        description: string | null;
        key: string;
    }>;
    /**
     * Update system setting
     */
    updateSetting(companyId: number, key: string, data: {
        value?: string;
        description?: string;
    }): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        value: string;
        description: string | null;
        key: string;
    }>;
    /**
     * Delete system setting
     */
    deleteSetting(companyId: number, key: string): Promise<{
        success: boolean;
    }>;
};
//# sourceMappingURL=systemSetting.service.d.ts.map