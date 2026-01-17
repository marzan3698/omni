import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
export declare const authController: {
    /**
     * Register a new user
     * POST /api/auth/register
     */
    register: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Login user
     * POST /api/auth/login
     */
    login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Register a new client
     * POST /api/auth/register-client
     */
    registerClient: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get current user profile
     * GET /api/auth/me
     */
    getProfile: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=auth.controller.d.ts.map