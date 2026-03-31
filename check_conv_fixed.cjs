const { PrismaClient } = require('./server/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function checkConversation() {
  try {
    const conv = await prisma.socialConversation.findUnique({
      where: { id: 34 },
      select: { id: true, platform: true, whatsappSlotId: true, companyId: true, externalUserId: true }
    });
    console.log('Conversation 34:', JSON.stringify(conv, null, 2));
    
    if (conv) {
      const integrations = await prisma.integration.findMany({
        where: { provider: conv.platform, companyId: conv.companyId },
        select: { id: true, pageId: true, isActive: true, provider: true }
      });
      console.log('Relevant Integrations:', JSON.stringify(integrations, null, 2));
      
      const slots = await prisma.integration.findMany({
        where: { provider: 'whatsapp', companyId: conv.companyId },
        select: { pageId: true, isActive: true, accountId: true }
      });
      console.log('All WhatsApp Slots:', JSON.stringify(slots, null, 2));
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkConversation();
