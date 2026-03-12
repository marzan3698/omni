import { Response, Request } from 'express';
import { bkashService } from '../services/bkash.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../types/index.js';
import { prisma } from '../lib/prisma.js';

export const bkashController = {
    /**
     * Create Payment
     * POST /api/bkash/create
     */
    createPayment: async (req: AuthRequest, res: Response) => {
        try {
            const companyId = req.user?.companyId;
            if (!companyId) return sendError(res, 'Company ID is required', 400);

            const { invoiceId, amount } = req.body;
            if (!invoiceId || !amount) {
                return sendError(res, 'Invoice ID and amount are required', 400);
            }

            // Base URL from the request to construct callback URL
            // Base URL from the request to construct callback URL
            const host = req.headers.host || '';
            const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
            const protocol = isLocalhost ? 'http' : 'https';
            const callbackUrl = `${protocol}://${host}/api/bkash/callback?companyId=${companyId}&invoiceId=${invoiceId}`;

            const data = await bkashService.createPayment(companyId, invoiceId, amount, callbackUrl);

            return sendSuccess(res, data, 'bKash payment created');
        } catch (error: any) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, error.message || 'Failed to create payment', 500);
        }
    },

    /**
     * Callback from bKash
     * GET /api/bkash/callback
     */
    callback: async (req: Request, res: Response) => {
        try {
            const { paymentID, status, companyId, invoiceId, signature } = req.query;

            if (!paymentID || !companyId || !invoiceId) {
                return res.status(400).send('Invalid callback parameters');
            }

            // Check callback status
            if (status === 'cancel' || status === 'failure') {
                // Redirect to a frontend page indicating failure
                return res.redirect(`/client/invoices/${invoiceId}?payment=${status}`);
            }

            if (status === 'success') {
                const executeResponse = await bkashService.executePayment(Number(companyId), paymentID as string);

                if (executeResponse && (executeResponse.statusCode === '0000' || executeResponse.transactionStatus === 'Completed')) {
                    // Find or create a payment gateway for bkash for record keeping
                    let gateway = await prisma.paymentGateway.findFirst({
                        where: {
                            companyId: Number(companyId),
                            name: { contains: 'bkash' }
                        }
                    });

                    if (!gateway) {
                        gateway = await prisma.paymentGateway.create({
                            data: {
                                companyId: Number(companyId),
                                name: 'bKash (Auto)',
                                accountType: 'Payment',
                                accountNumber: 'N/A',
                                isActive: true
                            }
                        });
                    }

                    const invoice = await prisma.invoice.findUnique({ where: { id: Number(invoiceId) } });

                    // Create Payment Record
                    await prisma.payment.create({
                        data: {
                            companyId: Number(companyId),
                            invoiceId: Number(invoiceId),
                            projectId: invoice?.projectId,
                            clientId: invoice?.clientId || 1, // fallback to avoid errors, shouldn't happen
                            paymentGatewayId: gateway.id,
                            amount: executeResponse.amount || 0,
                            transactionId: executeResponse.trxID || paymentID as string,
                            paymentMethod: 'bKash Auto',
                            status: 'Approved',
                            paidAt: new Date(),
                            verifiedAt: new Date(),
                            notes: 'Paid via bKash Tokenized Checkout'
                        }
                    });

                    // Mark invoice as Paid
                    await prisma.invoice.update({
                        where: { id: Number(invoiceId) },
                        data: { status: 'Paid' }
                    });

                    // Redirect to success UI
                    return res.redirect(`/client/invoices/${invoiceId}?payment=success&trxID=${executeResponse.trxID}`);
                } else {
                    return res.redirect(`/client/invoices/${invoiceId}?payment=failure&message=${executeResponse.statusMessage}`);
                }
            }

            return res.status(400).send('Unknown status');
        } catch (error: any) {
            console.error('Callback error:', error);
            const invoiceId = req.query.invoiceId;
            return res.redirect(`/client/invoices/${invoiceId}?payment=error`);
        }
    }
};
