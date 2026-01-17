import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
export declare const projectController: {
    /**
     * Get all projects for the authenticated client
     * GET /api/projects
     * For SuperAdmin, returns all projects
     * For other users, returns only their client projects
     */
    getClientProjects: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get project by ID
     * GET /api/projects/:id
     */
    getProjectById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Create a new project
     * POST /api/projects
     */
    createProject: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Update project
     * PUT /api/projects/:id
     */
    updateProject: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Sign project (submit e-signature)
     * POST /api/projects/:id/sign
     */
    signProject: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Update project status (admin only)
     * PUT /api/projects/:id/status
     */
    updateProjectStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get project statistics for the authenticated client
     * GET /api/projects/stats
     */
    getClientProjectStats: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=project.controller.d.ts.map