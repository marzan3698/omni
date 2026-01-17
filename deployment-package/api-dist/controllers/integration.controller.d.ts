import { Request, Response, NextFunction } from 'express';
export declare const integrationController: {
    /**
     * Create or update an integration
     * POST /api/integrations
     */
    upsertIntegration: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get all integrations
     * GET /api/integrations
     */
    getIntegrations: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get integration by ID
     * GET /api/integrations/:id
     */
    getIntegrationById: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Update integration
     * PUT /api/integrations/:id
     */
    updateIntegration: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Delete integration
     * DELETE /api/integrations/:id
     */
    deleteIntegration: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
};
//# sourceMappingURL=integration.controller.d.ts.map