import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
export const companyService = {
    /**
     * Get all companies
     */
    async getAllCompanies() {
        return await prisma.company.findMany({
            orderBy: { createdAt: 'desc' },
        });
    },
    /**
     * Get company by ID
     */
    async getCompanyById(id) {
        const company = await prisma.company.findUnique({
            where: { id },
            include: {
                companyContacts: {
                    orderBy: { date: 'desc' },
                    take: 10,
                },
                contracts: {
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: {
                        users: true,
                        employees: true,
                        clients: true,
                        leads: true,
                    },
                },
            },
        });
        if (!company) {
            throw new AppError('Company not found', 404);
        }
        return company;
    },
    /**
     * Create new company
     */
    async createCompany(data) {
        return await prisma.company.create({
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                address: data.address,
                industry: data.industry,
                website: data.website,
            },
        });
    },
    /**
     * Update company
     */
    async updateCompany(id, data) {
        const company = await prisma.company.findUnique({
            where: { id },
        });
        if (!company) {
            throw new AppError('Company not found', 404);
        }
        return await prisma.company.update({
            where: { id },
            data,
        });
    },
    /**
     * Delete company
     */
    async deleteCompany(id) {
        const company = await prisma.company.findUnique({
            where: { id },
        });
        if (!company) {
            throw new AppError('Company not found', 404);
        }
        return await prisma.company.delete({
            where: { id },
        });
    },
    /**
     * Get company contacts
     */
    async getCompanyContacts(companyId) {
        const company = await prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company) {
            throw new AppError('Company not found', 404);
        }
        return await prisma.companyContact.findMany({
            where: { companyId },
            orderBy: { date: 'desc' },
        });
    },
    /**
     * Add company contact
     */
    async addCompanyContact(companyId, data) {
        const company = await prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company) {
            throw new AppError('Company not found', 404);
        }
        return await prisma.companyContact.create({
            data: {
                companyId,
                type: data.type,
                value: data.value,
                description: data.description,
                date: data.date,
            },
        });
    },
    /**
     * Get company contracts
     */
    async getCompanyContracts(companyId) {
        const company = await prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company) {
            throw new AppError('Company not found', 404);
        }
        return await prisma.contract.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
        });
    },
    /**
     * Create company contract
     */
    async createCompanyContract(companyId, data) {
        const company = await prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company) {
            throw new AppError('Company not found', 404);
        }
        return await prisma.contract.create({
            data: {
                companyId,
                title: data.title,
                description: data.description,
                value: data.value ? data.value : undefined,
                startDate: data.startDate,
                endDate: data.endDate,
                documentUrl: data.documentUrl,
            },
        });
    },
    /**
     * Update contract
     */
    async updateContract(contractId, data) {
        const contract = await prisma.contract.findUnique({
            where: { id: contractId },
        });
        if (!contract) {
            throw new AppError('Contract not found', 404);
        }
        return await prisma.contract.update({
            where: { id: contractId },
            data,
        });
    },
    /**
     * Search companies
     */
    async searchCompanies(query) {
        return await prisma.company.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                    { industry: { contains: query, mode: 'insensitive' } },
                ],
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    },
};
//# sourceMappingURL=company.service.js.map