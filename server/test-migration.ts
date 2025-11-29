import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testMigration() {
  try {
    console.log('🔍 Checking database structure...\n');
    
    // Check if webhook_mode column exists
    const columns = await prisma.$queryRaw<Array<{Field: string, Type: string}>>`
      DESCRIBE integrations
    `;
    
    console.log('📋 Integration table columns:');
    columns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type}`);
    });
    
    const hasWebhookMode = columns.some(c => c.Field === 'webhook_mode');
    const hasWebhookActive = columns.some(c => c.Field === 'is_webhook_active');
    
    console.log('\n✅ Migration Status:');
    console.log(`   webhook_mode: ${hasWebhookMode ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   is_webhook_active: ${hasWebhookActive ? '✅ EXISTS' : '❌ MISSING'}`);
    
    // Check platform enum
    const platformColumns = await prisma.$queryRaw<Array<{Field: string, Type: string}>>`
      DESCRIBE social_conversations
    `;
    
    const platformCol = platformColumns.find(c => c.Field === 'platform');
    console.log(`\n📋 Social Platform enum: ${platformCol?.Type || 'NOT FOUND'}`);
    const hasChatwoot = platformCol?.Type.includes('chatwoot');
    console.log(`   chatwoot in enum: ${hasChatwoot ? '✅ YES' : '❌ NO'}`);
    
    if (!hasWebhookMode || !hasWebhookActive || !hasChatwoot) {
      console.log('\n❌ Migration incomplete! Please run the migration SQL.');
      process.exit(1);
    } else {
      console.log('\n✅ All migrations applied successfully!');
    }
    
    await prisma.$disconnect();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testMigration();

