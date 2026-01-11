#!/usr/bin/env node

/**
 * Quick script to check if a table exists in the database
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL || '';
let DB_HOST = 'localhost';
let DB_USER = 'root';
let DB_PASSWORD = '';
let DB_NAME = 'omni_db';

if (DATABASE_URL && DATABASE_URL.startsWith('mysql://')) {
  const url = new URL(DATABASE_URL);
  DB_USER = url.username;
  DB_PASSWORD = url.password;
  DB_HOST = url.hostname;
  DB_NAME = url.pathname.substring(1);
} else {
  DB_HOST = process.env.DB_HOST || DB_HOST;
  DB_USER = process.env.DB_USER || DB_USER;
  DB_PASSWORD = process.env.DB_PASSWORD || DB_PASSWORD;
  DB_NAME = process.env.DB_NAME || DB_NAME;
}

async function checkTable(tableName) {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
    });

    const [rows] = await connection.query(
      `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?`,
      [DB_NAME, tableName]
    );

    const exists = rows[0].count > 0;
    console.log(`Table '${tableName}': ${exists ? '✅ EXISTS' : '❌ DOES NOT EXIST'}`);
    
    if (exists) {
      const [columns] = await connection.query(
        `SHOW COLUMNS FROM ${tableName}`
      );
      console.log(`\nColumns in ${tableName}:`);
      columns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type})`);
      });
    }
    
    await connection.end();
    return exists;
  } catch (error) {
    if (connection) {
      await connection.end();
    }
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

const tableName = process.argv[2] || 'conversation_releases';
checkTable(tableName);


