const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'omni_db',
    multipleStatements: true,
  });

  try {
    console.log('🔄 Applying migration: add_project_and_group_to_tasks.sql\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '../prisma/migrations/add_project_and_group_to_tasks.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          console.log(`Executing: ${statement.substring(0, 80)}...`);
          await connection.execute(statement);
          console.log('✅ Success\n');
        } catch (error) {
          // Check if error is because column already exists
          if (error.message.includes('Duplicate column name')) {
            console.log('⚠️  Column already exists, skipping...\n');
          } else {
            throw error;
          }
        }
      }
    }

    console.log('✅ Migration applied successfully!');
    await connection.end();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await connection.end();
    process.exit(1);
  }
}

applyMigration();

