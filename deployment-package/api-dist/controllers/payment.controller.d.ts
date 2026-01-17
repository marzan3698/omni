import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
export declare const paymentController: {
    /**
     * Create payment (client submission)
     * POST /api/payments
     */
    create: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get payments by invoice
     * GET /api/payments/invoice/:invoiceId
     */
    getByInvoice: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get client's own payments
     * GET /api/payments/client
     */
    getClientPayments: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get all payments (admin)
     * GET /api/payments
     */
    getAll: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get payment by ID
     * GET /api/payments/:id
     */
    getById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Approve payment
     * PUT /api/payments/:id/approve
     */
    approve: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Reject payment
     * PUT /api/payments/:id/reject
     */
    reject: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=payment.controller.d.ts.map