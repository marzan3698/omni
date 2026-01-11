#!/usr/bin/env node

/**
 * Database Migration Runner
 * 
 * This script applies SQL migration files to the database.
 * It reads SQL files from server/prisma/migrations/ and applies them.
 * 
 * Usage: node server/scripts/migrate.js [migration-file.sql]
 *        node server/scripts/migrate.js (applies all pending migrations)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get database connection details from .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || process.env.DATABASE_URL?.split('/').pop()?.split('?')[0] || 'omni_db';

const MIGRATIONS_DIR = path.join(__dirname, '../prisma/migrations');
const MIGRATION_TRACKER_FILE = path.join(__dirname, '../prisma/migrations/.migrations_applied.json');

// Create migrations tracker file if it doesn't exist
if (!fs.existsSync(MIGRATION_TRACKER_FILE)) {
  fs.writeFileSync(MIGRATION_TRACKER_FILE, JSON.stringify([], null, 2));
}

function getAppliedMigrations() {
  try {
    const content = fs.readFileSync(MIGRATION_TRACKER_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return [];
  }
}

function markMigrationAsApplied(migrationFile) {
  const applied = getAppliedMigrations();
  if (!applied.includes(migrationFile)) {
    applied.push(migrationFile);
    fs.writeFileSync(MIGRATION_TRACKER_FILE, JSON.stringify(applied, null, 2));
  }
}

function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }
  
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();
}

function applyMigration(migrationFile) {
  const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationFile}`);
    process.exit(1);
  }

  console.log(`📄 Reading migration: ${migrationFile}`);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Build mysql command
  // Use mysql command line if available, otherwise use Node.js mysql2
  const mysqlCommand = `mysql -h ${DB_HOST} -u ${DB_USER} ${DB_PASSWORD ? `-p${DB_PASSWORD}` : ''} ${DB_NAME}`;
  
  try {
    console.log(`🔄 Applying migration: ${migrationFile}...`);
    
    // Try using mysql command line first
    try {
      execSync(`echo "${sql.replace(/"/g, '\\"')}" | ${mysqlCommand}`, {
        stdio: 'inherit',
        shell: '/bin/bash',
      });
      console.log(`✅ Migration applied successfully: ${migrationFile}`);
      markMigrationAsApplied(migrationFile);
      return true;
    } catch (mysqlError) {
      // If mysql command fails, try using Node.js mysql2
      console.log(`⚠️  mysql command not found, trying Node.js mysql2...`);
      
      const mysql = require('mysql2/promise');
      return mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        multipleStatements: true,
      }).then(async (connection) => {
        try {
          // Split SQL by semicolons and execute each statement
          const statements = sql.split(';').filter(s => s.trim().length > 0);
          for (const statement of statements) {
            if (statement.trim()) {
              await connection.query(statement);
            }
          }
          console.log(`✅ Migration applied successfully: ${migrationFile}`);
          markMigrationAsApplied(migrationFile);
          await connection.end();
          return true;
        } catch (error) {
          await connection.end();
          throw error;
        }
      }).catch((error) => {
        console.error(`❌ Error applying migration: ${migrationFile}`);
        console.error(`   Error: ${error.message}`);
        console.error(`\n💡 Tip: Make sure MySQL is running and credentials are correct.`);
        console.error(`   You can also apply migrations manually via phpMyAdmin.`);
        process.exit(1);
      });
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length > 0) {
  // Apply specific migration file
  const migrationFile = args[0];
  if (!migrationFile.endsWith('.sql')) {
    console.error('❌ Please provide a .sql migration file');
    process.exit(1);
  }
  
  const applied = getAppliedMigrations();
  if (applied.includes(migrationFile)) {
    console.log(`⚠️  Migration ${migrationFile} has already been applied.`);
    console.log(`   Use --force to apply again.`);
    if (!args.includes('--force')) {
      process.exit(0);
    }
  }
  
  applyMigration(migrationFile);
} else {
  // Apply all pending migrations
  console.log(`🔍 Checking for pending migrations...\n`);
  
  const migrationFiles = getMigrationFiles();
  const applied = getAppliedMigrations();
  const pending = migrationFiles.filter(file => !applied.includes(file));
  
  if (pending.length === 0) {
    console.log(`✅ All migrations have been applied.`);
    process.exit(0);
  }
  
  console.log(`📋 Found ${pending.length} pending migration(s):\n`);
  pending.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`);
  });
  console.log('');
  
  for (const migrationFile of pending) {
    const success = await applyMigration(migrationFile);
    if (!success) {
      console.error(`❌ Failed to apply migration: ${migrationFile}`);
      process.exit(1);
    }
    console.log('');
  }
  
  console.log(`✅ All migrations applied successfully!`);
}

