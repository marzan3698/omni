import { Request, Response } from 'express';
export declare const companyController: {
    /**
     * Get all companies
     * GET /api/companies
     */
    getAllCompanies: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get company by ID
     * GET /api/companies/:id
     */
    getCompanyById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Create company
     * POST /api/companies
     */
    createCompany: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Update company
     * PUT /api/companies/:id
     */
    updateCompany: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Delete company
     * DELETE /api/companies/:id
     */
    deleteCompany: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get company contacts
     * GET /api/companies/:id/contacts
     */
    getCompanyContacts: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Add company contact
     * POST /api/companies/:id/contacts
     */
    addCompanyContact: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get company contracts
     * GET /api/companies/:id/contracts
     */
    getCompanyContracts: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Create company contract
     * POST /api/companies/:id/contracts
     */
    createCompanyContract: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Update contract
     * PUT /api/companies/contracts/:id
     */
    updateContract: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Search companies
     * GET /api/companies/search?q=query
     */
    searchCompanies: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=company.controller.d.ts.map