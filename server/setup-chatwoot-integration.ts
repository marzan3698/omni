import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupChatwootIntegration() {
  try {
    console.log('Setting up Chatwoot integration...');

    // Get the first company (default company)
    const company = await prisma.company.findFirst();
    if (!company) {
      throw new Error('No company found. Please create a company first.');
    }
    console.log('Using company ID:', company.id);

    // Check if integration already exists
    const existing = await prisma.integration.findFirst({
      where: {
        provider: 'chatwoot',
        pageId: '86358', // Inbox ID
        companyId: company.id,
      },
    });

    const integrationData = {
      provider: 'chatwoot' as const,
      pageId: '86358', // Inbox ID
      accessToken: 'qSWfDCFTePbiCZde2WVe5iiV',
      accountId: '143580',
      baseUrl: 'https://app.chatwoot.com',
      isActive: true,
      webhookMode: 'live' as const,
      isWebhookActive: true,
      companyId: company.id,
    };

    if (existing) {
      console.log('Updating existing Chatwoot integration...');
      // If enabling this integration, disable all other integrations for this company
      await prisma.integration.updateMany({
        where: {
          companyId: company.id,
          isActive: true,
          id: { not: existing.id },
        },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      const updated = await prisma.integration.update({
        where: { id: existing.id },
        data: integrationData,
      });
      console.log('✅ Chatwoot integration updated successfully!');
      console.log('Integration ID:', updated.id);
      console.log('Company ID:', updated.companyId);
      console.log('Account ID:', updated.accountId);
      console.log('Inbox ID:', updated.pageId);
      console.log('Webhook Mode:', updated.webhookMode);
      console.log('Webhook Active:', updated.isWebhookActive);
      console.log('Integration Active:', updated.isActive);
    } else {
      console.log('Creating new Chatwoot integration...');
      // If enabling this integration, disable all other integrations for this company
      await prisma.integration.updateMany({
        where: {
          companyId: company.id,
          isActive: true,
        },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      const created = await prisma.integration.create({
        data: integrationData,
      });
      console.log('✅ Chatwoot integration created successfully!');
      console.log('Integration ID:', created.id);
      console.log('Company ID:', created.companyId);
      console.log('Account ID:', created.accountId);
      console.log('Inbox ID:', created.pageId);
      console.log('Webhook Mode:', created.webhookMode);
      console.log('Webhook Active:', created.isWebhookActive);
      console.log('Integration Active:', created.isActive);
    }
  } catch (error) {
    console.error('❌ Error setting up Chatwoot integration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupChatwootIntegration();
