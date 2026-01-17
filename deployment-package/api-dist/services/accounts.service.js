import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
export const accountsService = {
    /**
     * Get all accounts payable for a company
     */
    async getAllPayables(companyId, filters) {
        return await prisma.accountPayable.findMany({
            where: {
                companyId,
                ...(filters?.status && { status: filters.status }),
            },
            orderBy: { dueDate: 'asc' },
        });
    },
    /**
     * Get all accounts receivable for a company
     */
    async getAllReceivables(companyId, filters) {
        return await prisma.accountReceivable.findMany({
            where: {
                companyId,
                ...(filters?.status && { status: filters.status }),
                ...(filters?.clientId && { clientId: filters.clientId }),
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        contactInfo: true,
                    },
                },
                invoice: {
                    select: {
                        id: true,
                        invoiceNumber: true,
                        totalAmount: true,
                    },
                },
            },
            orderBy: { dueDate: 'asc' },
        });
    },
    /**
     * Get account payable by ID
     */
    async getPayableById(id, companyId) {
        const payable = await prisma.accountPayable.findFirst({
            where: {
                id,
                companyId,
            },
        });
        if (!payable) {
            throw new AppError('Account payable not found', 404);
        }
        return payable;
    },
    /**
     * Get account receivable by ID
     */
    async getReceivableById(id, companyId) {
        const receivable = await prisma.accountReceivable.findFirst({
            where: {
                id,
                companyId,
            },
            include: {
                client: true,
                invoice: true,
            },
        });
        if (!receivable) {
            throw new AppError('Account receivable not found', 404);
        }
        return receivable;
    },
    /**
     * Create account payable
     */
    async createPayable(data) {
        return await prisma.accountPayable.create({
            data: {
                companyId: data.companyId,
                vendorName: data.vendorName,
                amount: data.amount,
                dueDate: data.dueDate,
                description: data.description,
            },
        });
    },
    /**
     * Create account receivable
     */
    async createReceivable(data) {
        // Verify client if provided
        if (data.clientId) {
            const client = await prisma.client.findFirst({
                where: {
                    id: data.clientId,
                    companyId: data.companyId,
                },
            });
            if (!client) {
                throw new AppError('Client not found', 404);
            }
        }
        // Verify invoice if provided
        if (data.invoiceId) {
            const invoice = await prisma.invoice.findFirst({
                where: {
                    id: data.invoiceId,
                    companyId: data.companyId,
                },
            });
            if (!invoice) {
                throw new AppError('Invoice not found', 404);
            }
        }
        return await prisma.accountReceivable.create({
            data: {
                companyId: data.companyId,
                clientId: data.clientId,
                invoiceId: data.invoiceId,
                amount: data.amount,
                dueDate: data.dueDate,
                description: data.description,
            },
            include: {
                client: true,
                invoice: true,
            },
        });
    },
    /**
     * Update account payable
     */
    async updatePayable(id, companyId, data) {
        const payable = await prisma.accountPayable.findFirst({
            where: {
                id,
                companyId,
            },
        });
        if (!payable) {
            throw new AppError('Account payable not found', 404);
        }
        return await prisma.accountPayable.update({
            where: { id },
            data,
        });
    },
    /**
     * Update account receivable
     */
    async updateReceivable(id, companyId, data) {
        const receivable = await prisma.accountReceivable.findFirst({
            where: {
                id,
                companyId,
            },
        });
        if (!receivable) {
            throw new AppError('Account receivable not found', 404);
        }
        return await prisma.accountReceivable.update({
            where: { id },
            data,
            include: {
                client: true,
                invoice: true,
            },
        });
    },
    /**
     * Delete account payable
     */
    async deletePayable(id, companyId) {
        const payable = await prisma.accountPayable.findFirst({
            where: {
                id,
                companyId,
            },
        });
        if (!payable) {
            throw new AppError('Account payable not found', 404);
        }
        return await prisma.accountPayable.delete({
            where: { id },
        });
    },
    /**
     * Delete account receivable
     */
    async deleteReceivable(id, companyId) {
        const receivable = await prisma.accountReceivable.findFirst({
            where: {
                id,
                companyId,
            },
        });
        if (!receivable) {
            throw new AppError('Account receivable not found', 404);
        }
        return await prisma.accountReceivable.delete({
            where: { id },
        });
    },
};
//# sourceMappingURL=accounts.service.js.map