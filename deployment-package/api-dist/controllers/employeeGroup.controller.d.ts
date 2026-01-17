import { Request, Response } from 'express';
export declare const employeeGroupController: {
    /**
     * Get all employee groups
     * GET /api/employee-groups?companyId=1
     */
    getAllGroups: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get employee group by ID
     * GET /api/employee-groups/:id?companyId=1
     */
    getGroupById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Create employee group
     * POST /api/employee-groups
     */
    createGroup: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Update employee group
     * PUT /api/employee-groups/:id?companyId=1
     */
    updateGroup: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Delete employee group
     * DELETE /api/employee-groups/:id?companyId=1
     */
    deleteGroup: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get group members
     * GET /api/employee-groups/:id/members?companyId=1
     */
    getGroupMembers: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=employeeGroup.controller.d.ts.map