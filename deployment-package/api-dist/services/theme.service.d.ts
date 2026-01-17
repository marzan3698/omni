export declare const themeService: {
    /**
     * Get all theme-related settings for a company
     */
    getThemeSettings(companyId: number): Promise<{
        siteLogo: string | null;
        siteName: string;
        contactEmail: string;
        contactPhone: string;
        contactAddress: string;
    }>;
    /**
     * Update theme settings
     */
    updateThemeSettings(companyId: number, data: {
        siteName?: string;
        contactEmail?: string;
        contactPhone?: string;
        contactAddress?: string;
    }): Promise<{
        siteLogo: string | null;
        siteName: string;
        contactEmail: string;
        contactPhone: string;
        contactAddress: string;
    }>;
    /**
     * Handle logo upload and save path
     */
    uploadLogo(companyId: number, filePath: string): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        value: string;
        description: string | null;
        key: string;
    }>;
};
//# sourceMappingURL=theme.service.d.ts.map