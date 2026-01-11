const mysql = require('mysql2/promise');

async function addColumns() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'omni_db',
    multipleStatements: true,
  });

  try {
    console.log('🔄 Adding project_id and group_id columns to tasks table...\n');

    // Add project_id column
    try {
      await connection.execute(`
        ALTER TABLE \`tasks\`
        ADD COLUMN \`project_id\` INT NULL AFTER \`due_date\`
      `);
      console.log('✅ Added project_id column');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('⚠️  project_id column already exists, skipping...');
      } else {
        throw error;
      }
    }

    // Add group_id column
    try {
      await connection.execute(`
        ALTER TABLE \`tasks\`
        ADD COLUMN \`group_id\` INT NULL AFTER \`assigned_to\`
      `);
      console.log('✅ Added group_id column');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('⚠️  group_id column already exists, skipping...');
      } else {
        throw error;
      }
    }

    // Add indexes
    try {
      await connection.execute(`ALTER TABLE \`tasks\` ADD INDEX \`idx_project_id\` (\`project_id\`)`);
      console.log('✅ Added index for project_id');
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('⚠️  Index idx_project_id already exists, skipping...');
      } else {
        throw error;
      }
    }

    try {
      await connection.execute(`ALTER TABLE \`tasks\` ADD INDEX \`idx_group_id\` (\`group_id\`)`);
      console.log('✅ Added index for group_id');
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('⚠️  Index idx_group_id already exists, skipping...');
      } else {
        throw error;
      }
    }

    // Add foreign key constraints
    try {
      await connection.execute(`
        ALTER TABLE \`tasks\`
        ADD CONSTRAINT \`fk_tasks_project\`
        FOREIGN KEY (\`project_id\`)
        REFERENCES \`projects\`(\`id\`)
        ON DELETE SET NULL
      `);
      console.log('✅ Added foreign key constraint for project_id');
    } catch (error) {
      if (error.message.includes('Duplicate foreign key constraint name')) {
        console.log('⚠️  Foreign key fk_tasks_project already exists, skipping...');
      } else {
        console.log('⚠️  Could not add foreign key for project_id:', error.message);
      }
    }

    try {
      await connection.execute(`
        ALTER TABLE \`tasks\`
        ADD CONSTRAINT \`fk_tasks_group\`
        FOREIGN KEY (\`group_id\`)
        REFERENCES \`employee_groups\`(\`id\`)
        ON DELETE SET NULL
      `);
      console.log('✅ Added foreign key constraint for group_id');
    } catch (error) {
      if (error.message.includes('Duplicate foreign key constraint name')) {
        console.log('⚠️  Foreign key fk_tasks_group already exists, skipping...');
      } else {
        console.log('⚠️  Could not add foreign key for group_id:', error.message);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    await connection.end();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    await connection.end();
    process.exit(1);
  }
}

addColumns();

