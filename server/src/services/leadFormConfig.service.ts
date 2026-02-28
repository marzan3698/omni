import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import crypto from 'crypto';

const ALLOWED_FIELDS = ['customerName', 'phone', 'description', 'categoryId', 'interestId', 'value'];

const DEFAULT_FIELD_CONFIG = {
  fields: [
    { key: 'customerName', label: 'Name', required: true, order: 0, type: 'text' },
    { key: 'phone', label: 'Phone', required: true, order: 1, type: 'text' },
    { key: 'description', label: 'Description', required: false, order: 2, type: 'textarea' },
    { key: 'categoryId', label: 'Category', required: false, order: 3, type: 'select' },
    { key: 'interestId', label: 'Interest', required: false, order: 4, type: 'select' },
    { key: 'value', label: 'Est. Value', required: false, order: 5, type: 'number' },
  ],
};

const DEFAULT_DESIGN_CONFIG = {
  title: 'Get in Touch',
  submitButtonText: 'Submit',
  primaryColor: '#4f46e5',
  successMessage: 'Thank you! We will contact you soon.',
};

function generateSlug(): string {
  return crypto.randomBytes(16).toString('hex');
}

function validateFieldConfig(fieldConfig: any): any {
  const fc = fieldConfig?.fields;
  if (!Array.isArray(fc)) return DEFAULT_FIELD_CONFIG;
  const validated = fc
    .filter((f: any) => f?.key && ALLOWED_FIELDS.includes(f.key))
    .map((f: any) => ({
      key: f.key,
      label: f.label || f.key,
      required: !!f.required,
      order: typeof f.order === 'number' ? f.order : 0,
      type: ['text', 'textarea', 'select', 'number'].includes(f.type) ? f.type : 'text',
    }));
  return { fields: validated.length > 0 ? validated : DEFAULT_FIELD_CONFIG.fields };
}

export const leadFormConfigService = {
  async getBySlug(slug: string) {
    const config = await prisma.leadFormConfig.findFirst({
      where: { slug, isActive: true },
      include: { company: { select: { id: true, name: true } } },
    });
    if (!config) {
      throw new AppError('Lead form not found', 404);
    }
    return config;
  },

  async getDefaultPublicConfig(): Promise<{ fieldConfig: any; designConfig: any; categories: any[]; interests: any[]; slug: string } | null> {
    const defaultCompanyId = parseInt(process.env.DEFAULT_COMPANY_ID || '1', 10);
    let config = await prisma.leadFormConfig.findFirst({
      where: { companyId: defaultCompanyId, isActive: true },
    });
    if (!config) {
      config = await this.createDefault(defaultCompanyId);
    }
    return this.getPublicConfig(config.slug);
  },

  async getPublicConfig(slug: string) {
    const config = await this.getBySlug(slug);
    const categories = await prisma.leadCategory.findMany({
      where: { companyId: config.companyId, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    const interests = await prisma.leadInterest.findMany({
      where: { companyId: config.companyId, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    const fieldConfig = (config.fieldConfig as any)?.fields ? (config.fieldConfig as any) : DEFAULT_FIELD_CONFIG;
    const designConfig = (config.designConfig as any)?.title ? (config.designConfig as any) : DEFAULT_DESIGN_CONFIG;
    return {
      fieldConfig,
      designConfig,
      categories,
      interests,
      slug: config.slug,
    };
  },

  async getByCompanyId(companyId: number) {
    let config = await prisma.leadFormConfig.findFirst({
      where: { companyId },
    });
    if (!config) {
      config = await this.createDefault(companyId);
    }
    return config;
  },

  async createDefault(companyId: number) {
    const slug = generateSlug();
    return prisma.leadFormConfig.create({
      data: {
        companyId,
        slug,
        name: 'Website Lead Form',
        fieldConfig: DEFAULT_FIELD_CONFIG as any,
        designConfig: DEFAULT_DESIGN_CONFIG as any,
        isActive: true,
      },
    });
  },

  async getOrCreate(companyId: number) {
    return this.getByCompanyId(companyId);
  },

  async update(companyId: number, data: {
    name?: string;
    fieldConfig?: any;
    designConfig?: any;
    attributionUserId?: string | null;
    isActive?: boolean;
  }) {
    let config = await prisma.leadFormConfig.findFirst({ where: { companyId } });
    if (!config) {
      config = await this.createDefault(companyId);
    }
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.fieldConfig !== undefined) updateData.fieldConfig = validateFieldConfig(data.fieldConfig) as any;
    if (data.designConfig !== undefined) updateData.designConfig = data.designConfig as any;
    if (data.attributionUserId !== undefined) updateData.attributionUserId = data.attributionUserId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    return prisma.leadFormConfig.update({
      where: { id: config.id },
      data: updateData,
    });
  },

  async getAttributionUserId(companyId: number, config: { attributionUserId?: string | null }): Promise<string> {
    if (config.attributionUserId) {
      const user = await prisma.user.findFirst({
        where: { id: config.attributionUserId, companyId },
      });
      if (user) return user.id;
    }
    const admin = await prisma.user.findFirst({
      where: { companyId },
      include: { role: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!admin) {
      throw new AppError('No user found in company for lead attribution', 500);
    }
    return admin.id;
  },

  getEmbedCode(slug: string, baseUrl: string): { iframe: string; script?: string } {
    const url = `${baseUrl.replace(/\/$/, '')}/embed/lead-form/${slug}`;
    return {
      iframe: `<iframe src="${url}" width="400" height="500" frameborder="0" style="border: none;"></iframe>`,
      script: `<!-- Omni Lead Form -->
<iframe src="${url}" width="400" height="500" frameborder="0" style="border: none;"></iframe>`,
    };
  },
};
