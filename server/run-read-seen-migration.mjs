import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🔄 Running migration: add_read_seen_to_messages...\n');
    
    // Add columns one by one with error handling
    const columns = [
      { name: 'is_read', type: 'BOOLEAN NOT NULL DEFAULT FALSE', after: 'image_url' },
      { name: 'read_at', type: 'DATETIME NULL', after: 'is_read' },
      { name: 'is_seen', type: 'BOOLEAN NOT NULL DEFAULT FALSE', after: 'read_at' },
      { name: 'seen_at', type: 'DATETIME NULL', after: 'is_seen' },
    ];
    
    for (const col of columns) {
      try {
        console.log(`📝 Adding column: ${col.name}...`);
        await prisma.$executeRawUnsafe(
          `ALTER TABLE social_messages ADD COLUMN ${col.name} ${col.type} AFTER ${col.after}`
        );
        console.log(`✅ Column ${col.name} added successfully\n`);
      } catch (error) {
        if (error.code === 'P2010' && (
          error.meta?.message?.includes('Duplicate column') ||
          error.meta?.message?.includes('ER_DUP_FIELDNAME')
        )) {
          console.log(`⚠️  Column ${col.name} already exists, skipping...\n`);
        } else {
          throw error;
        }
      }
    }
    
    // Add indexes
    const indexes = [
      { name: 'idx_is_read', column: 'is_read' },
      { name: 'idx_is_seen', column: 'is_seen' },
    ];
    
    for (const idx of indexes) {
      try {
        console.log(`📝 Adding index: ${idx.name}...`);
        await prisma.$executeRawUnsafe(
          `CREATE INDEX ${idx.name} ON social_messages(${idx.column})`
        );
        console.log(`✅ Index ${idx.name} added successfully\n`);
      } catch (error) {
        if (error.code === 'P2010' && (
          error.meta?.message?.includes('Duplicate key') ||
          error.meta?.message?.includes('ER_DUP_KEYNAME') ||
          error.meta?.message?.includes('already exists')
        )) {
          console.log(`⚠️  Index ${idx.name} already exists, skipping...\n`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 Columns added: is_read, read_at, is_seen, seen_at');
    console.log('📋 Indexes added: idx_is_read, idx_is_seen');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration()
  .then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error.message);
    process.exit(1);
  });

