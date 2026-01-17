interface CreateCompanyData {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    industry?: string;
    website?: string;
}
interface UpdateCompanyData {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    industry?: string;
    website?: string;
    isActive?: boolean;
}
interface CreateContactData {
    type: string;
    value: string;
    description?: string;
    date: Date;
}
interface CreateContractData {
    title: string;
    description?: string;
    value?: number;
    startDate: Date;
    endDate?: Date;
    documentUrl?: string;
}
export declare const companyService: {
    /**
     * Get all companies
     */
    getAllCompanies(): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        phone: string | null;
        address: string | null;
        industry: string | null;
        website: string | null;
        isActive: boolean;
    }[]>;
    /**
     * Get company by ID
     */
    getCompanyById(id: number): Promise<{
        companyContacts: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            companyId: number;
            value: string;
            type: string;
            description: string | null;
            date: Date;
        }[];
        contracts: {
            status: import(".prisma/client").$Enums.ContractStatus;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            companyId: number;
            value: import("@prisma/client/runtime/library.js").Decimal | null;
            title: string;
            description: string | null;
            startDate: Date;
            endDate: Date | null;
            documentUrl: string | null;
        }[];
        _count: {
            users: number;
            employees: number;
            clients: number;
            leads: number;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        phone: string | null;
        address: string | null;
        industry: string | null;
        website: string | null;
        isActive: boolean;
    }>;
    /**
     * Create new company
     */
    createCompany(data: CreateCompanyData): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        phone: string | null;
        address: string | null;
        industry: string | null;
        website: string | null;
        isActive: boolean;
    }>;
    /**
     * Update company
     */
    updateCompany(id: number, data: UpdateCompanyData): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        phone: string | null;
        address: string | null;
        industry: string | null;
        website: string | null;
        isActive: boolean;
    }>;
    /**
     * Delete company
     */
    deleteCompany(id: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        phone: string | null;
        address: string | null;
        industry: string | null;
        website: string | null;
        isActive: boolean;
    }>;
    /**
     * Get company contacts
     */
    getCompanyContacts(companyId: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        value: string;
        type: string;
        description: string | null;
        date: Date;
    }[]>;
    /**
     * Add company contact
     */
    addCompanyContact(companyId: number, data: CreateContactData): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        value: string;
        type: string;
        description: string | null;
        date: Date;
    }>;
    /**
     * Get company contracts
     */
    getCompanyContracts(companyId: number): Promise<{
        status: import(".prisma/client").$Enums.ContractStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        value: import("@prisma/client/runtime/library.js").Decimal | null;
        title: string;
        description: string | null;
        startDate: Date;
        endDate: Date | null;
        documentUrl: string | null;
    }[]>;
    /**
     * Create company contract
     */
    createCompanyContract(companyId: number, data: CreateContractData): Promise<{
        status: import(".prisma/client").$Enums.ContractStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        value: import("@prisma/client/runtime/library.js").Decimal | null;
        title: string;
        description: string | null;
        startDate: Date;
        endDate: Date | null;
        documentUrl: string | null;
    }>;
    /**
     * Update contract
     */
    updateContract(contractId: number, data: Partial<CreateContractData> & {
        status?: string;
    }): Promise<{
        status: import(".prisma/client").$Enums.ContractStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number;
        value: import("@prisma/client/runtime/library.js").Decimal | null;
        title: string;
        description: string | null;
        startDate: Date;
        endDate: Date | null;
        documentUrl: string | null;
    }>;
    /**
     * Search companies
     */
    searchCompanies(query: string): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        phone: string | null;
        address: string | null;
        industry: string | null;
        website: string | null;
        isActive: boolean;
    }[]>;
};
export {};
//# sourceMappingURL=company.service.d.ts.map