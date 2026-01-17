import { Request, Response } from 'express';
import { AuthRequest } from '../types/index.js';
export declare const leadController: {
    /**
     * Get all leads
     * GET /api/leads?companyId=1&status=New&source=Inbox
     */
    getAllLeads: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get lead by ID
     * GET /api/leads/:id
     */
    getLeadById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Create lead from inbox
     * POST /api/leads/from-inbox/:conversationId
     */
    createLeadFromInbox: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Create lead
     * POST /api/leads
     */
    createLead: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Update lead
     * PUT /api/leads/:id
     */
    updateLead: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Update lead status
     * PUT /api/leads/:id/status
     */
    updateLeadStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Delete lead
     * DELETE /api/leads/:id
     */
    deleteLead: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Convert lead to client
     * POST /api/leads/:id/convert
     */
    convertLeadToClient: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get lead pipeline
     * GET /api/leads/pipeline?companyId=1
     */
    getLeadPipeline: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get leads for client from their campaigns
     * GET /api/leads/client?campaignId=1
     */
    getClientLeads: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=lead.controller.d.ts.map