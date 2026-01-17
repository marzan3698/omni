import { Request, Response } from 'express';
export declare const leadMeetingController: {
    /**
     * Get all meetings for a lead
     * GET /api/leads/:leadId/meetings
     */
    getLeadMeetings: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Create a meeting for a lead
     * POST /api/leads/:leadId/meetings
     */
    createLeadMeeting: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Update a meeting for a lead
     * PUT /api/leads/:leadId/meetings/:id
     */
    updateLeadMeeting: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Delete a meeting for a lead
     * DELETE /api/leads/:leadId/meetings/:id
     */
    deleteLeadMeeting: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get all meetings for a company (role-based filtering)
     * GET /api/meetings
     */
    getAllMeetings: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get next upcoming meeting for current user (within 1 hour)
     * GET /api/meetings/upcoming
     */
    getUpcomingMeeting: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=leadMeeting.controller.d.ts.map