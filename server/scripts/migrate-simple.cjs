#!/usr/bin/env node

/**
 * Simple Database Migration Runner
 * Uses Node.js mysql2 to apply SQL migrations
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Parse DATABASE_URL or use individual env vars
const DATABASE_URL = process.env.DATABASE_URL || '';
let DB_HOST = 'localhost';
let DB_USER = 'root';
let DB_PASSWORD = '';
let DB_NAME = 'omni_db';

if (DATABASE_URL && DATABASE_URL.startsWith('mysql://')) {
  // Parse mysql://user:password@host:port/database
  const url = new URL(DATABASE_URL);
  DB_USER = url.username;
  DB_PASSWORD = url.password;
  DB_HOST = url.hostname;
  DB_NAME = url.pathname.substring(1); // Remove leading /
} else {
  DB_HOST = process.env.DB_HOST || DB_HOST;
  DB_USER = process.env.DB_USER || DB_USER;
  DB_PASSWORD = process.env.DB_PASSWORD || DB_PASSWORD;
  DB_NAME = process.env.DB_NAME || DB_NAME;
}

const MIGRATIONS_DIR = path.join(__dirname, '../prisma/migrations');
const MIGRATION_TRACKER_FILE = path.join(__dirname, '../prisma/migrations/.migrations_applied.json');

function getAppliedMigrations() {
  if (!fs.existsSync(MIGRATION_TRACKER_FILE)) {
    return [];
  }
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

async function applyMigration(migrationFile) {
  const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);
  
  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Migration file not found: ${migrationFile}`);
  }

  console.log(`📄 Reading migration: ${migrationFile}`);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log(`🔄 Applying migration: ${migrationFile}...`);
  
  let connection;
  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      multipleStatements: true,
    });

    // Split SQL by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
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
    if (connection) {
      await connection.end();
    }
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');

  try {
    if (args.length > 0 && !args[0].startsWith('--')) {
      // Apply specific migration file
      const migrationFile = args[0];
      if (!migrationFile.endsWith('.sql')) {
        console.error('❌ Please provide a .sql migration file');
        process.exit(1);
      }
      
      const applied = getAppliedMigrations();
      if (applied.includes(migrationFile) && !force) {
        console.log(`⚠️  Migration ${migrationFile} has already been applied.`);
        console.log(`   Use --force to apply again.`);
        process.exit(0);
      }
      
      await applyMigration(migrationFile);
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
        await applyMigration(migrationFile);
        console.log('');
      }
      
      console.log(`✅ All migrations applied successfully!`);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.error(`\n💡 Tip: Make sure MySQL/XAMPP is running.`);
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error(`\n💡 Tip: Check database credentials in .env file.`);
    }
    process.exit(1);
  }
}

main();

