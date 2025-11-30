import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixTable() {
  try {
    // Check and add company_id if missing
    try {
      await prisma.$executeRaw`ALTER TABLE integrations ADD COLUMN company_id INT NOT NULL DEFAULT 1 AFTER id`;
      console.log('✅ Added company_id column');
    } catch (e) {
      if (e.message.includes('Duplicate column') || e.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ company_id column already exists');
      } else {
        throw e;
      }
    }
    
    // Check and add webhook_mode if missing
    try {
      await prisma.$executeRaw`ALTER TABLE integrations ADD COLUMN webhook_mode ENUM('local', 'live') NULL DEFAULT 'local' AFTER is_active`;
      console.log('✅ Added webhook_mode column');
    } catch (e) {
      if (e.message.includes('Duplicate column') || e.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ webhook_mode column already exists');
      } else {
        throw e;
      }
    }
    
    // Check and add is_webhook_active if missing
    try {
      await prisma.$executeRaw`ALTER TABLE integrations ADD COLUMN is_webhook_active BOOLEAN NOT NULL DEFAULT FALSE AFTER webhook_mode`;
      console.log('✅ Added is_webhook_active column');
    } catch (e) {
      if (e.message.includes('Duplicate column') || e.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ is_webhook_active column already exists');
      } else {
        throw e;
      }
    }
    
    // Update unique constraint
    try {
      await prisma.$executeRaw`ALTER TABLE integrations DROP INDEX unique_provider_page`;
      console.log('✅ Dropped old unique constraint');
    } catch (e) {
      console.log('✓ Old unique constraint not found or already dropped');
    }
    
    try {
      await prisma.$executeRaw`ALTER TABLE integrations ADD UNIQUE KEY unique_company_provider_page (company_id, provider, page_id)`;
      console.log('✅ Added new unique constraint');
    } catch (e) {
      if (e.message.includes('Duplicate key') || e.code === 'ER_DUP_KEYNAME') {
        console.log('✓ Unique constraint already exists');
      } else {
        throw e;
      }
    }
    
    console.log('✅ Migration completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixTable();
