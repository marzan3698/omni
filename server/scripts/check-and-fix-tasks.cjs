#!/usr/bin/env node

const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'omni_db';

async function checkAndFix() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
    });

    // Check if column exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'tasks' 
      AND COLUMN_NAME = 'company_id'
    `, [DB_NAME]);

    if (columns.length === 0) {
      console.log('❌ company_id column does not exist. Adding it...');
      
      // Add the column
      await connection.query(`
        ALTER TABLE \`tasks\` 
        ADD COLUMN \`company_id\` INT NOT NULL DEFAULT 1 AFTER \`id\`
      `);
      
      // Add index
      await connection.query(`
        ALTER TABLE \`tasks\`
        ADD INDEX \`idx_company_id\` (\`company_id\`)
      `);
      
      // Add foreign key
      await connection.query(`
        ALTER TABLE \`tasks\`
        ADD CONSTRAINT \`fk_tasks_company\` 
        FOREIGN KEY (\`company_id\`) 
        REFERENCES \`companies\`(\`id\`) 
        ON DELETE CASCADE
      `);
      
      console.log('✅ company_id column added successfully!');
    } else {
      console.log('✅ company_id column already exists');
    }

    // Verify
    const [verify] = await connection.query('DESCRIBE tasks');
    console.log('\n📋 Current tasks table structure:');
    console.table(verify);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  Column already exists (duplicate name error)');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkAndFix();

