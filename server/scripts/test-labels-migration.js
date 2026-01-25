// Test script to verify conversation_labels migration works
import { prisma } from '../lib/prisma.js';

async function testLabelsMigration() {
  try {
    console.log('Testing conversation_labels migration...\n');

    // Test 1: Check if table exists
    console.log('1. Checking if conversation_labels table exists...');
    const tableExists = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'conversation_labels'
    `;
    console.log('✅ Table exists:', tableExists[0].count > 0);

    // Test 2: Check table structure
    console.log('\n2. Checking table structure...');
    const columns = await prisma.$queryRaw`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
      AND table_name = 'conversation_labels'
      ORDER BY ORDINAL_POSITION
    `;
    console.log('Columns:', columns);

    // Test 3: Check indexes
    console.log('\n3. Checking indexes...');
    const indexes = await prisma.$queryRaw`
      SHOW INDEXES FROM conversation_labels
    `;
    console.log('Indexes:', indexes);

    // Test 4: Test Prisma model access
    console.log('\n4. Testing Prisma model access...');
    const count = await prisma.conversationLabel.count();
    console.log('✅ Prisma model accessible. Current label count:', count);

    console.log('\n✅ All tests passed! Migration is working correctly.');
  } catch (error) {
    console.error('❌ Error testing migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testLabelsMigration();
