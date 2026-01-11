const mysql = require('mysql2/promise');

async function createTaskCommentsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'omni_db',
    multipleStatements: true,
  });

  try {
    console.log('🔄 Creating task_comments table...\n');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`task_comments\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`task_id\` INT NOT NULL,
        \`user_id\` VARCHAR(36) NOT NULL,
        \`content\` TEXT NOT NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_task_id\` (\`task_id\`),
        INDEX \`idx_user_id\` (\`user_id\`),
        FOREIGN KEY (\`task_id\`) REFERENCES \`tasks\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Created task_comments table successfully!');
    await connection.end();
  } catch (error) {
    console.error('❌ Failed to create table:', error.message);
    if (error.message.includes('already exists')) {
      console.log('⚠️  Table already exists, continuing...');
      await connection.end();
      return;
    }
    await connection.end();
    process.exit(1);
  }
}

createTaskCommentsTable();

