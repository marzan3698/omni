import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
export declare const themeController: {
    /**
     * Get theme settings (public endpoint - can be accessed without auth)
     */
    getThemeSettings: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Update theme settings
     */
    updateThemeSettings: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Upload logo
     */
    uploadLogo: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=theme.controller.d.ts.map