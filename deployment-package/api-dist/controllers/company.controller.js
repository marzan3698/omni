import { companyService } from '../services/company.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
// Validation schemas
const createCompanySchema = z.object({
    name: z.string().min(1, 'Company name is required'),
    email: z.string().email('Invalid email').optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    industry: z.string().optional(),
    website: z.string().url('Invalid URL').optional().or(z.literal('')),
});
const updateCompanySchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email('Invalid email').optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    industry: z.string().optional(),
    website: z.string().url('Invalid URL').optional().or(z.literal('')),
    isActive: z.boolean().optional(),
});
const createContactSchema = z.object({
    type: z.string().min(1, 'Contact type is required'),
    value: z.string().min(1, 'Contact value is required'),
    description: z.string().optional(),
    date: z.string().datetime().or(z.date()),
});
const createContractSchema = z.object({
    title: z.string().min(1, 'Contract title is required'),
    description: z.string().optional(),
    value: z.number().positive().optional(),
    startDate: z.string().datetime().or(z.date()),
    endDate: z.string().datetime().or(z.date()).optional(),
    documentUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});
export const companyController = {
    /**
     * Get all companies
     * GET /api/companies
     */
    getAllCompanies: async (req, res) => {
        try {
            const companies = await companyService.getAllCompanies();
            return sendSuccess(res, companies, 'Companies retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to retrieve companies', 500);
        }
    },
    /**
     * Get company by ID
     * GET /api/companies/:id
     */
    getCompanyById: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return sendError(res, 'Invalid company ID', 400);
            }
            const company = await companyService.getCompanyById(id);
            return sendSuccess(res, company, 'Company retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to retrieve company', 500);
        }
    },
    /**
     * Create company
     * POST /api/companies
     */
    createCompany: async (req, res) => {
        try {
            const validatedData = createCompanySchema.parse(req.body);
            const company = await companyService.createCompany(validatedData);
            return sendSuccess(res, company, 'Company created successfully', 201);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to create company', 500);
        }
    },
    /**
     * Update company
     * PUT /api/companies/:id
     */
    updateCompany: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return sendError(res, 'Invalid company ID', 400);
            }
            const validatedData = updateCompanySchema.parse(req.body);
            const company = await companyService.updateCompany(id, validatedData);
            return sendSuccess(res, company, 'Company updated successfully');
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to update company', 500);
        }
    },
    /**
     * Delete company
     * DELETE /api/companies/:id
     */
    deleteCompany: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return sendError(res, 'Invalid company ID', 400);
            }
            await companyService.deleteCompany(id);
            return sendSuccess(res, null, 'Company deleted successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to delete company', 500);
        }
    },
    /**
     * Get company contacts
     * GET /api/companies/:id/contacts
     */
    getCompanyContacts: async (req, res) => {
        try {
            const companyId = parseInt(req.params.id);
            if (isNaN(companyId)) {
                return sendError(res, 'Invalid company ID', 400);
            }
            const contacts = await companyService.getCompanyContacts(companyId);
            return sendSuccess(res, contacts, 'Contacts retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to retrieve contacts', 500);
        }
    },
    /**
     * Add company contact
     * POST /api/companies/:id/contacts
     */
    addCompanyContact: async (req, res) => {
        try {
            const companyId = parseInt(req.params.id);
            if (isNaN(companyId)) {
                return sendError(res, 'Invalid company ID', 400);
            }
            const validatedData = createContactSchema.parse(req.body);
            const contact = await companyService.addCompanyContact(companyId, {
                ...validatedData,
                date: validatedData.date instanceof Date ? validatedData.date : new Date(validatedData.date),
            });
            return sendSuccess(res, contact, 'Contact added successfully', 201);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to add contact', 500);
        }
    },
    /**
     * Get company contracts
     * GET /api/companies/:id/contracts
     */
    getCompanyContracts: async (req, res) => {
        try {
            const companyId = parseInt(req.params.id);
            if (isNaN(companyId)) {
                return sendError(res, 'Invalid company ID', 400);
            }
            const contracts = await companyService.getCompanyContracts(companyId);
            return sendSuccess(res, contracts, 'Contracts retrieved successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to retrieve contracts', 500);
        }
    },
    /**
     * Create company contract
     * POST /api/companies/:id/contracts
     */
    createCompanyContract: async (req, res) => {
        try {
            const companyId = parseInt(req.params.id);
            if (isNaN(companyId)) {
                return sendError(res, 'Invalid company ID', 400);
            }
            const validatedData = createContractSchema.parse(req.body);
            const contract = await companyService.createCompanyContract(companyId, {
                ...validatedData,
                startDate: validatedData.startDate instanceof Date ? validatedData.startDate : new Date(validatedData.startDate),
                endDate: validatedData.endDate ? (validatedData.endDate instanceof Date ? validatedData.endDate : new Date(validatedData.endDate)) : undefined,
            });
            return sendSuccess(res, contract, 'Contract created successfully', 201);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to create contract', 500);
        }
    },
    /**
     * Update contract
     * PUT /api/companies/contracts/:id
     */
    updateContract: async (req, res) => {
        try {
            const contractId = parseInt(req.params.id);
            if (isNaN(contractId)) {
                return sendError(res, 'Invalid contract ID', 400);
            }
            const validatedData = createContractSchema.partial().parse(req.body);
            const contract = await companyService.updateContract(contractId, validatedData);
            return sendSuccess(res, contract, 'Contract updated successfully');
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return sendError(res, error.errors[0].message, 400);
            }
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to update contract', 500);
        }
    },
    /**
     * Search companies
     * GET /api/companies/search?q=query
     */
    searchCompanies: async (req, res) => {
        try {
            const query = req.query.q;
            if (!query || query.trim().length === 0) {
                return sendError(res, 'Search query is required', 400);
            }
            const companies = await companyService.searchCompanies(query);
            return sendSuccess(res, companies, 'Search completed successfully');
        }
        catch (error) {
            if (error instanceof AppError) {
                return sendError(res, error.message, error.statusCode);
            }
            return sendError(res, 'Failed to search companies', 500);
        }
    },
};
//# sourceMappingURL=company.controller.js.map