import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
export declare const adminController: {
    /**
     * Get all projects
     * GET /api/admin/projects
     */
    getAllProjects: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get all clients
     * GET /api/admin/clients
     */
    getAllClients: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Update project
     * PUT /api/admin/projects/:id
     */
    updateProject: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Delete project
     * DELETE /api/admin/projects/:id
     */
    deleteProject: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Update client
     * PUT /api/admin/clients/:id
     */
    updateClient: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Delete client
     * DELETE /api/admin/clients/:id
     */
    deleteClient: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get client by ID with all details
     * GET /api/admin/clients/:id
     */
    getClientById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get project by ID with all details
     * GET /api/admin/projects/:id
     */
    getProjectById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=admin.controller.d.ts.map