import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixTable() {
  try {
    // Check and add company_id if missing
    try {
      await prisma.$executeRaw`ALTER TABLE social_conversations ADD COLUMN company_id INT NOT NULL DEFAULT 1 AFTER id`;
      console.log('✅ Added company_id column');
    } catch (e) {
      if (e.message.includes('Duplicate column') || e.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ company_id column already exists');
      } else {
        throw e;
      }
    }
    
    // Add foreign key if it doesn't exist
    try {
      await prisma.$executeRaw`ALTER TABLE social_conversations ADD CONSTRAINT fk_social_conversations_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE`;
      console.log('✅ Added foreign key constraint');
    } catch (e) {
      if (e.message.includes('Duplicate key') || e.code === 'ER_DUP_KEYNAME') {
        console.log('✓ Foreign key already exists');
      } else {
        throw e;
      }
    }
    
    // Add index on company_id
    try {
      await prisma.$executeRaw`ALTER TABLE social_conversations ADD INDEX idx_company_id (company_id)`;
      console.log('✅ Added index on company_id');
    } catch (e) {
      if (e.message.includes('Duplicate key') || e.code === 'ER_DUP_KEYNAME') {
        console.log('✓ Index already exists');
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
