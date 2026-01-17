import { paymentService } from '../services/payment.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
// Validation schemas
const createPaymentSchema = z.object({
    invoiceId: z.number().int().positive('Invoice ID is required'),
    paymentGatewayId: z.number().int().positive('Payment gateway ID is required'),
    amount: z.number().positive('Amount must be greater than 0'),
    transactionId: z.string().min(1, 'Transaction ID is required').max(100, 'Transaction ID must be less than 100 characters'),
    paidBy: z.string().max(255).optional(),
    notes: z.string().max(5000).optional(),
});
const approvePaymentSchema = z.object({
    adminNotes: z.string().max(5000).optional(),
});
const rejectPaymentSchema = z.object({
    adminNotes: z.string().min(1, 'Admin notes are required for rejection').max(5000),
});
export const paymentController = {
    /**
     * Create payment (client submission)
     * POST /api/payments
     */
    create: async (req, res) => {
        try {
            const companyId = req.user?.companyId;
            if (!companyId) {
                return sendError(res, 'Company ID is required', 400);
            }
            const validatedData = createPaymentSchema.parse(req.body);
            const payment = await paymentService.createPayment({
                ...validatedData,
                companyId,
            });
            return sendSuccess(res, payment, 'Payment submitted successfully', 201);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to submit payment', 500);
        }
    },
    /**
     * Get payments by invoice
     * GET /api/payments/invoice/:invoiceId
     */
    getByInvoice: async (req, res) => {
        try {
            const invoiceId = parseInt(req.params.invoiceId);
            const companyId = req.user?.companyId;
            if (isNaN(invoiceId) || !companyId) {
                return sendError(res, 'Invalid invoice ID or company ID', 400);
            }
            const payments = await paymentService.getPaymentsByInvoice(invoiceId, companyId);
            return sendSuccess(res, payments, 'Payments retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to retrieve payments', 500);
        }
    },
    /**
     * Get client's own payments
     * GET /api/payments/client
     */
    getClientPayments: async (req, res) => {
        try {
            const companyId = req.user?.companyId;
            const userEmail = req.user?.email;
            if (!companyId || !userEmail) {
                return sendError(res, 'User not authenticated', 401);
            }
            // Find client by email
            const clients = await prisma.$queryRawUnsafe(`SELECT id FROM clients WHERE company_id = ? AND LOWER(JSON_UNQUOTE(JSON_EXTRACT(contact_info, '$.email'))) = LOWER(?) LIMIT 1`, companyId, userEmail);
            if (clients.length === 0) {
                return sendSuccess(res, [], 'No payments found');
            }
            const clientId = clients[0].id;
            const payments = await paymentService.getPaymentsByClient(clientId, companyId);
            return sendSuccess(res, payments, 'Payments retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to retrieve payments', 500);
        }
    },
    /**
     * Get all payments (admin)
     * GET /api/payments
     */
    getAll: async (req, res) => {
        try {
            const companyId = req.user?.companyId;
            if (!companyId) {
                return sendError(res, 'Company ID is required', 400);
            }
            const status = req.query.status;
            const clientId = req.query.clientId ? parseInt(req.query.clientId) : undefined;
            const payments = await paymentService.getAllPayments(companyId, {
                status,
                clientId: clientId && !isNaN(clientId) ? clientId : undefined,
            });
            return sendSuccess(res, payments, 'Payments retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to retrieve payments', 500);
        }
    },
    /**
     * Get payment by ID
     * GET /api/payments/:id
     */
    getById: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const companyId = req.user?.companyId;
            if (isNaN(id) || !companyId) {
                return sendError(res, 'Invalid ID or company ID', 400);
            }
            const payment = await paymentService.getPaymentById(id, companyId);
            return sendSuccess(res, payment, 'Payment retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to retrieve payment', 500);
        }
    },
    /**
     * Approve payment
     * PUT /api/payments/:id/approve
     */
    approve: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const companyId = req.user?.companyId;
            const adminId = req.user?.id;
            if (isNaN(id) || !companyId || !adminId) {
                return sendError(res, 'Invalid ID, company ID, or user ID', 400);
            }
            const validatedData = approvePaymentSchema.parse(req.body);
            const payment = await paymentService.approvePayment(id, companyId, adminId, validatedData.adminNotes);
            return sendSuccess(res, payment, 'Payment approved successfully');
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to approve payment', 500);
        }
    },
    /**
     * Reject payment
     * PUT /api/payments/:id/reject
     */
    reject: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const companyId = req.user?.companyId;
            const adminId = req.user?.id;
            if (isNaN(id) || !companyId || !adminId) {
                return sendError(res, 'Invalid ID, company ID, or user ID', 400);
            }
            const validatedData = rejectPaymentSchema.parse(req.body);
            const payment = await paymentService.rejectPayment(id, companyId, adminId, validatedData.adminNotes);
            return sendSuccess(res, payment, 'Payment rejected successfully');
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to reject payment', 500);
        }
    },
};
//# sourceMappingURL=payment.controller.js.map