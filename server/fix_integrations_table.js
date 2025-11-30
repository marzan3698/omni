const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTable() {
  try {
    // Use raw SQL to add columns
    await prisma.$executeRaw`
      ALTER TABLE integrations 
      ADD COLUMN IF NOT EXISTS company_id INT NOT NULL DEFAULT 1 AFTER id
    `;
    console.log('✅ Added company_id column');
  } catch (e) {
    if (e.message.includes('Duplicate column')) {
      console.log('company_id column already exists');
    } else {
      throw e;
    }
  }
  
  try {
    await prisma.$executeRaw`
      ALTER TABLE integrations 
      ADD COLUMN IF NOT EXISTS webhook_mode ENUM('local', 'live') NULL DEFAULT 'local' AFTER is_active
    `;
    console.log('✅ Added webhook_mode column');
  } catch (e) {
    if (e.message.includes('Duplicate column')) {
      console.log('webhook_mode column already exists');
    } else {
      throw e;
    }
  }
  
  try {
    await prisma.$executeRaw`
      ALTER TABLE integrations 
      ADD COLUMN IF NOT EXISTS is_webhook_active BOOLEAN NOT NULL DEFAULT FALSE AFTER webhook_mode
    `;
    console.log('✅ Added is_webhook_active column');
  } catch (e) {
    if (e.message.includes('Duplicate column')) {
      console.log('is_webhook_active column already exists');
    } else {
      throw e;
    }
  }
  
  await prisma.$disconnect();
}

fixTable().catch(console.error);
