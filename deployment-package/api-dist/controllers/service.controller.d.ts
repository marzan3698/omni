import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
export declare const serviceController: {
    /**
     * Create a new service
     * POST /api/services
     */
    createService: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get all services
     * GET /api/services
     */
    getAllServices: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get service by ID
     * GET /api/services/:id
     */
    getServiceById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Update service
     * PUT /api/services/:id
     */
    updateService: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Delete service
     * DELETE /api/services/:id
     */
    deleteService: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=service.controller.d.ts.map