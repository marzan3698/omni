import { Request, Response } from 'express';
export declare const leadCallController: {
    /**
     * Get all calls for a lead
     * GET /api/leads/:leadId/calls
     */
    getLeadCalls: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Create a call for a lead
     * POST /api/leads/:leadId/calls
     */
    createLeadCall: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Update a call for a lead
     * PUT /api/leads/:leadId/calls/:id
     */
    updateLeadCall: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Delete a call for a lead
     * DELETE /api/leads/:leadId/calls/:id
     */
    deleteLeadCall: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Add/update call notes
     * POST /api/leads/:leadId/calls/:id/notes
     */
    addCallNote: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get all calls for a company (role-based filtering)
     * GET /api/calls
     */
    getAllCalls: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get upcoming calls for current user
     * GET /api/calls/upcoming
     */
    getUpcomingCalls: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=leadCall.controller.d.ts.map