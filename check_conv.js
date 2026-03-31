import { prisma } from './server/src/lib/prisma.js';

async function checkConversation() {
  const conv = await prisma.socialConversation.findUnique({
    where: { id: 34 },
    select: { id: true, platform: true, whatsappSlotId: true, companyId: true, externalUserId: true }
  });
  console.log('Conversation 34:', JSON.stringify(conv, null, 2));
  
  const integrations = await prisma.integration.findMany({
    where: { provider: 'whatsapp', companyId: conv?.companyId },
    select: { id: true, pageId: true, isActive: true }
  });
  console.log('WhatsApp Integrations:', JSON.stringify(integrations, null, 2));
}

checkConversation().catch(console.error);
