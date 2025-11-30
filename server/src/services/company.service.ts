import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

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
  async getCompanyById(id: number) {
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
  async createCompany(data: CreateCompanyData) {
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
  async updateCompany(id: number, data: UpdateCompanyData) {
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
  async deleteCompany(id: number) {
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
  async getCompanyContacts(companyId: number) {
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
  async addCompanyContact(companyId: number, data: CreateContactData) {
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
  async getCompanyContracts(companyId: number) {
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
  async createCompanyContract(companyId: number, data: CreateContractData) {
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
  async updateContract(contractId: number, data: Partial<CreateContractData> & { status?: string }) {
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
  async searchCompanies(query: string) {
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

