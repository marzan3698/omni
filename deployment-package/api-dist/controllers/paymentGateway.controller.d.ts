import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
export declare const paymentGatewayController: {
    /**
     * Get all payment gateways
     * GET /api/payment-gateways
     */
    getAll: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get active payment gateways (for clients)
     * GET /api/payment-gateways/active
     */
    getActive: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get payment gateway by ID
     * GET /api/payment-gateways/:id
     */
    getById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Create payment gateway
     * POST /api/payment-gateways
     */
    create: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Update payment gateway
     * PUT /api/payment-gateways/:id
     */
    update: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Delete payment gateway
     * DELETE /api/payment-gateways/:id
     */
    delete: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=paymentGateway.controller.d.ts.map