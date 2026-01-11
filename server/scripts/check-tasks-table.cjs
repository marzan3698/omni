const mysql = require('mysql2/promise');

async function checkTasksTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'omni_db',
  });

  try {
    console.log('🔍 Checking tasks table structure...\n');
    
    // Get table structure
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tasks'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'omni_db']);

    console.log('📋 Tasks table columns:');
    columns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}, ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    // Check if project_id and group_id exist
    const hasProjectId = columns.some(col => col.COLUMN_NAME === 'project_id');
    const hasGroupId = columns.some(col => col.COLUMN_NAME === 'group_id');
    const hasCompanyId = columns.some(col => col.COLUMN_NAME === 'company_id');

    console.log('\n✅ Column check:');
    console.log(`   - project_id: ${hasProjectId ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   - group_id: ${hasGroupId ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   - company_id: ${hasCompanyId ? '✅ EXISTS' : '❌ MISSING'}`);

    if (!hasProjectId || !hasGroupId) {
      console.log('\n⚠️  Missing columns detected! Need to run migration.');
      process.exit(1);
    } else {
      console.log('\n✅ All required columns exist!');
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error checking table:', error.message);
    await connection.end();
    process.exit(1);
  }
}

checkTasksTable();

