import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🚀 Starting image_url migration for social_messages...\n');

    // Check if column exists
    const columnCheck = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'social_messages'
        AND COLUMN_NAME = 'image_url'
    `);
    
    const exists = columnCheck[0].count > 0;
    
    if (!exists) {
      console.log('➕ Adding image_url column...');
      await prisma.$executeRawUnsafe(`
        ALTER TABLE social_messages 
        ADD COLUMN image_url VARCHAR(500) NULL AFTER content
      `);
      console.log('✅ Added image_url column');
    } else {
      console.log('✓ image_url column already exists');
    }

    // Add index if it doesn't exist
    const indexCheck = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'social_messages'
        AND INDEX_NAME = 'idx_image_url'
    `);
    
    const indexExists = indexCheck[0].count > 0;
    
    if (!indexExists) {
      console.log('➕ Adding index on image_url...');
      await prisma.$executeRawUnsafe(`
        ALTER TABLE social_messages 
        ADD INDEX idx_image_url (image_url)
      `);
      console.log('✅ Added index on image_url');
    } else {
      console.log('✓ Index already exists');
    }

    console.log('\n✅ Migration completed successfully!');
    
    // Verify
    const verification = await prisma.$queryRawUnsafe(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(image_url) as messages_with_images
      FROM social_messages
    `);
    
    console.log('\n📊 Verification:');
    console.log('   Total messages:', verification[0].total_messages);
    console.log('   Messages with images:', verification[0].messages_with_images);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();

