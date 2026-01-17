import { Request, Response } from 'express';
export declare const campaignController: {
    /**
     * Get all campaigns
     * GET /api/campaigns?companyId=1&type=sale&active=true
     */
    getAllCampaigns: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get campaign by ID
     * GET /api/campaigns/:id?companyId=1
     */
    getCampaignById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Create campaign
     * POST /api/campaigns
     */
    createCampaign: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Update campaign
     * PUT /api/campaigns/:id?companyId=1
     */
    updateCampaign: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Delete campaign
     * DELETE /api/campaigns/:id?companyId=1
     */
    deleteCampaign: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get campaign statistics
     * GET /api/campaigns/:id/statistics?companyId=1
     */
    getCampaignStatistics: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get active campaigns
     * GET /api/campaigns/active?companyId=1
     */
    getActiveCampaigns: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get campaign groups (employee groups assigned to campaign)
     * GET /api/campaigns/:id/groups?companyId=1
     */
    getCampaignGroups: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get campaign products
     * GET /api/campaigns/:id/products?companyId=1
     */
    getCampaignProducts: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get campaign clients
     * GET /api/campaigns/:id/clients?companyId=1
     */
    getCampaignClients: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get campaigns for authenticated client
     * GET /api/campaigns/client
     */
    getClientCampaigns: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=campaign.controller.d.ts.map