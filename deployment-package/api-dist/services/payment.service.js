import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { Prisma } from '@prisma/client';
export const paymentService = {
    /**
     * Create a new payment (client submission)
     */
    async createPayment(data) {
        // Verify invoice exists and belongs to the company
        const invoice = await prisma.invoice.findFirst({
            where: {
                id: data.invoiceId,
                companyId: data.companyId,
            },
            include: {
                client: true,
                project: true,
                payments: {
                    where: {
                        status: {
                            in: ['Pending', 'Approved'],
                        },
                    },
                },
            },
        });
        if (!invoice) {
            throw new AppError('Invoice not found', 404);
        }
        // Verify payment gateway exists and is active
        const gateway = await prisma.paymentGateway.findFirst({
            where: {
                id: data.paymentGatewayId,
                companyId: data.companyId,
                isActive: true,
            },
        });
        if (!gateway) {
            throw new AppError('Payment gateway not found or inactive', 404);
        }
        // Calculate total paid amount (including pending payments)
        const totalPaid = invoice.payments.reduce((sum, payment) => {
            return sum + Number(payment.amount);
        }, 0);
        const paymentAmount = new Prisma.Decimal(data.amount);
        const invoiceTotal = invoice.totalAmount;
        const remainingAmount = new Prisma.Decimal(invoiceTotal).minus(new Prisma.Decimal(totalPaid));
        // Validate payment amount
        if (paymentAmount.lessThanOrEqualTo(0)) {
            throw new AppError('Payment amount must be greater than 0', 400);
        }
        if (paymentAmount.greaterThan(remainingAmount)) {
            throw new AppError(`Payment amount cannot exceed remaining amount: ${remainingAmount.toString()}`, 400);
        }
        // Validate paidBy format if provided (Bangladesh mobile number)
        if (data.paidBy) {
            const accountNumberRegex = /^01[3-9]\d{8}$/;
            if (!accountNumberRegex.test(data.paidBy)) {
                throw new AppError('Invalid paid by account number format. Must be a valid Bangladesh mobile number (01XXXXXXXXX)', 400);
            }
        }
        // Create payment
        const payment = await prisma.payment.create({
            data: {
                companyId: data.companyId,
                invoiceId: data.invoiceId,
                projectId: invoice.projectId || null,
                clientId: invoice.clientId,
                paymentGatewayId: data.paymentGatewayId,
                amount: paymentAmount,
                transactionId: data.transactionId,
                paymentMethod: gateway.name,
                status: 'Pending',
                paidBy: data.paidBy || null,
                notes: data.notes || null,
                paidAt: new Date(),
            },
            include: {
                invoice: true,
                project: true,
                client: true,
                paymentGateway: true,
            },
        });
        return payment;
    },
    /**
     * Get payments by invoice ID
     */
    async getPaymentsByInvoice(invoiceId, companyId) {
        // Verify invoice exists
        const invoice = await prisma.invoice.findFirst({
            where: {
                id: invoiceId,
                companyId,
            },
        });
        if (!invoice) {
            throw new AppError('Invoice not found', 404);
        }
        return await prisma.payment.findMany({
            where: {
                invoiceId,
                companyId,
            },
            include: {
                paymentGateway: true,
                client: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    },
    /**
     * Get payments by client ID
     */
    async getPaymentsByClient(clientId, companyId) {
        return await prisma.payment.findMany({
            where: {
                clientId,
                companyId,
            },
            include: {
                invoice: {
                    select: {
                        id: true,
                        invoiceNumber: true,
                        totalAmount: true,
                    },
                },
                project: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                paymentGateway: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    },
    /**
     * Get all payments (for admin)
     */
    async getAllPayments(companyId, filters) {
        return await prisma.payment.findMany({
            where: {
                companyId,
                ...(filters?.status && { status: filters.status }),
                ...(filters?.clientId && { clientId: filters.clientId }),
            },
            include: {
                invoice: {
                    select: {
                        id: true,
                        invoiceNumber: true,
                        totalAmount: true,
                    },
                },
                project: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                client: true,
                paymentGateway: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    },
    /**
     * Approve payment
     */
    async approvePayment(paymentId, companyId, adminId, adminNotes) {
        // Get payment with invoice and project
        const payment = await prisma.payment.findFirst({
            where: {
                id: paymentId,
                companyId,
            },
            include: {
                invoice: {
                    include: {
                        payments: {
                            where: {
                                status: 'Approved',
                            },
                        },
                    },
                },
                project: true,
            },
        });
        if (!payment) {
            throw new AppError('Payment not found', 404);
        }
        if (payment.status !== 'Pending') {
            throw new AppError('Only pending payments can be approved', 400);
        }
        // Update payment status
        const updatedPayment = await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: 'Approved',
                verifiedAt: new Date(),
                verifiedBy: adminId,
                adminNotes: adminNotes || null,
            },
            include: {
                invoice: true,
                project: true,
                client: true,
                paymentGateway: true,
            },
        });
        // Calculate total approved payments for this invoice
        const totalApproved = await prisma.payment.aggregate({
            where: {
                invoiceId: payment.invoiceId,
                status: 'Approved',
            },
            _sum: {
                amount: true,
            },
        });
        const totalApprovedAmount = totalApproved._sum.amount || new Prisma.Decimal(0);
        const invoiceTotal = payment.invoice.totalAmount;
        // Update invoice status if fully paid
        if (totalApprovedAmount.greaterThanOrEqualTo(invoiceTotal)) {
            await prisma.invoice.update({
                where: { id: payment.invoiceId },
                data: { status: 'Paid' },
            });
            // Update account receivable if exists
            await prisma.accountReceivable.updateMany({
                where: {
                    invoiceId: payment.invoiceId,
                    status: 'Pending',
                },
                data: {
                    status: 'Paid',
                    paidDate: new Date(),
                },
            });
        }
        // Update project status if project exists and is in Submitted status
        if (payment.projectId && payment.project) {
            if (payment.project.status === 'Submitted') {
                await prisma.project.update({
                    where: { id: payment.projectId },
                    data: { status: 'StartedWorking' },
                });
            }
        }
        return updatedPayment;
    },
    /**
     * Reject payment
     */
    async rejectPayment(paymentId, companyId, adminId, adminNotes) {
        const payment = await prisma.payment.findFirst({
            where: {
                id: paymentId,
                companyId,
            },
        });
        if (!payment) {
            throw new AppError('Payment not found', 404);
        }
        if (payment.status !== 'Pending') {
            throw new AppError('Only pending payments can be rejected', 400);
        }
        return await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: 'Rejected',
                verifiedAt: new Date(),
                verifiedBy: adminId,
                adminNotes: adminNotes || null,
            },
            include: {
                invoice: true,
                project: true,
                client: true,
                paymentGateway: true,
            },
        });
    },
    /**
     * Get payment by ID
     */
    async getPaymentById(paymentId, companyId) {
        const payment = await prisma.payment.findFirst({
            where: {
                id: paymentId,
                companyId,
            },
            include: {
                invoice: true,
                project: true,
                client: true,
                paymentGateway: true,
            },
        });
        if (!payment) {
            throw new AppError('Payment not found', 404);
        }
        return payment;
    },
};
//# sourceMappingURL=payment.service.js.map