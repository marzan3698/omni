import { Request, Response } from 'express';
export declare const installController: {
    /**
     * Check installation status
     * GET /api/install/status
     */
    checkStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Check prerequisites
     * POST /api/install/check-prerequisites
     */
    checkPrerequisites: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Test database connection
     * POST /api/install/test-database
     */
    testDatabase: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Setup database
     * POST /api/install/setup-database
     */
    setupDatabase: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Create admin user
     * POST /api/install/create-admin
     */
    createAdmin: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Finalize installation
     * POST /api/install/finalize
     */
    finalize: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Automatic setup - create database and user
     * POST /api/install/auto-setup
     */
    autoSetup: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Complete automatic installation
     * POST /api/install/complete-auto
     */
    completeAuto: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=install.controller.d.ts.map