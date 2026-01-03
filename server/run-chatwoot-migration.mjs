import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🚀 Starting Chatwoot webhook migration...\n');

    // Read the SQL migration file
    const migrationPath = join(__dirname, 'prisma', 'migrations', 'add_company_id_to_social_conversations.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip SET and PREPARE/EXECUTE statements as they need special handling
      if (statement.startsWith('SET @') || 
          statement.startsWith('PREPARE') || 
          statement.startsWith('EXECUTE') || 
          statement.startsWith('DEALLOCATE')) {
        console.log(`⏭️  Skipping statement ${i + 1} (requires special handling)`);
        continue;
      }

      try {
        console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);
        await prisma.$executeRawUnsafe(statement);
        console.log(`✅ Statement ${i + 1} executed successfully\n`);
      } catch (error) {
        // Handle expected errors (column/constraint already exists)
        if (error.message.includes('Duplicate column') || 
            error.code === 'ER_DUP_FIELDNAME' ||
            error.message.includes('Duplicate key') ||
            error.code === 'ER_DUP_KEYNAME' ||
            error.message.includes('already exists')) {
          console.log(`✓ Statement ${i + 1} skipped (already exists)\n`);
        } else {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          throw error;
        }
      }
    }

    // Manual execution of the conditional column addition
    console.log('🔍 Checking if company_id column exists...');
    try {
      const columnCheck = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'social_conversations'
          AND COLUMN_NAME = 'company_id'
      `);
      
      const exists = columnCheck[0].count > 0;
      
      if (!exists) {
        console.log('➕ Adding company_id column...');
        await prisma.$executeRawUnsafe(`
          ALTER TABLE social_conversations 
          ADD COLUMN company_id INT NOT NULL DEFAULT 1 AFTER id
        `);
        console.log('✅ Added company_id column');
      } else {
        console.log('✓ company_id column already exists');
      }
    } catch (error) {
      if (error.message.includes('Duplicate column') || error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ company_id column already exists');
      } else {
        throw error;
      }
    }

    // Add index
    console.log('🔍 Checking if index exists...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE social_conversations 
        ADD INDEX idx_company_id (company_id)
      `);
      console.log('✅ Added index on company_id');
    } catch (error) {
      if (error.message.includes('Duplicate key') || error.code === 'ER_DUP_KEYNAME') {
        console.log('✓ Index already exists');
      } else {
        throw error;
      }
    }

    // Add foreign key constraint
    console.log('🔍 Checking if foreign key exists...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE social_conversations 
        ADD CONSTRAINT fk_social_conversations_company 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      `);
      console.log('✅ Added foreign key constraint');
    } catch (error) {
      if (error.message.includes('Duplicate key') || error.code === 'ER_DUP_KEYNAME') {
        console.log('✓ Foreign key already exists');
      } else {
        throw error;
      }
    }

    // Update existing records
    console.log('\n🔄 Updating existing records...');
    
    // Update Chatwoot conversations
    const chatwootUpdate = await prisma.$executeRawUnsafe(`
      UPDATE social_conversations sc
      LEFT JOIN integrations i ON (
        i.provider = 'chatwoot' 
        AND sc.external_user_id LIKE CONCAT('chatwoot_%')
      )
      SET sc.company_id = COALESCE(i.company_id, 1)
      WHERE sc.company_id = 1 OR sc.company_id IS NULL
    `);
    console.log(`✅ Updated ${chatwootUpdate} Chatwoot conversations`);

    // Update Facebook conversations
    const facebookUpdate = await prisma.$executeRawUnsafe(`
      UPDATE social_conversations sc
      LEFT JOIN integrations i ON (
        i.provider = 'facebook' 
        AND sc.platform = 'facebook'
      )
      SET sc.company_id = COALESCE(i.company_id, 1)
      WHERE (sc.company_id = 1 OR sc.company_id IS NULL) 
        AND sc.platform = 'facebook'
    `);
    console.log(`✅ Updated ${facebookUpdate} Facebook conversations`);

    // Remove DEFAULT constraint
    console.log('\n🔧 Removing DEFAULT constraint...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE social_conversations 
        MODIFY COLUMN company_id INT NOT NULL
      `);
      console.log('✅ Removed DEFAULT constraint');
    } catch (error) {
      console.log('⚠️  Could not remove DEFAULT constraint (may require MySQL 8.0.13+)');
      console.log('   This is not critical - the column will still work correctly');
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Verification:');
    
    // Verify the migration
    const verification = await prisma.$queryRawUnsafe(`
      SELECT 
        COUNT(*) as total_conversations,
        COUNT(DISTINCT company_id) as unique_companies,
        MIN(company_id) as min_company_id,
        MAX(company_id) as max_company_id
      FROM social_conversations
    `);
    
    console.log('   Total conversations:', verification[0].total_conversations);
    console.log('   Unique companies:', verification[0].unique_companies);
    console.log('   Company ID range:', `${verification[0].min_company_id} - ${verification[0].max_company_id}`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();

