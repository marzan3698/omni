#!/bin/bash

# Script to run conversation_labels migration
# This ensures the migration works on fresh databases

echo "Running conversation_labels migration..."

# Get database connection details from .env
DB_USER=$(grep DATABASE_URL .env | sed -n 's/.*mysql:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(grep DATABASE_URL .env | sed -n 's/.*mysql:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(grep DATABASE_URL .env | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(grep DATABASE_URL .env | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(grep DATABASE_URL .env | sed -n 's/.*\/\([^"]*\)".*/\1/p')

# Default values if parsing fails
DB_USER=${DB_USER:-root}
DB_PASS=${DB_PASS:-}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_NAME=${DB_NAME:-omni_db}

echo "Connecting to database: $DB_NAME on $DB_HOST:$DB_PORT"

# Try to find MySQL in common XAMPP locations
MYSQL_PATH=""
if [ -f "/Applications/XAMPP/xamppfiles/bin/mysql" ]; then
  MYSQL_PATH="/Applications/XAMPP/xamppfiles/bin/mysql"
elif [ -f "/opt/lampp/bin/mysql" ]; then
  MYSQL_PATH="/opt/lampp/bin/mysql"
elif command -v mysql &> /dev/null; then
  MYSQL_PATH="mysql"
fi

if [ -z "$MYSQL_PATH" ]; then
  echo "Error: MySQL client not found. Please run the migration manually:"
  echo "mysql -u $DB_USER -p $DB_NAME < prisma/migrations/add_conversation_labels.sql"
  exit 1
fi

# Run the migration
if [ -z "$DB_PASS" ]; then
  $MYSQL_PATH -u "$DB_USER" -h "$DB_HOST" -P "$DB_PORT" "$DB_NAME" < prisma/migrations/add_conversation_labels.sql
else
  $MYSQL_PATH -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" -P "$DB_PORT" "$DB_NAME" < prisma/migrations/add_conversation_labels.sql
fi

if [ $? -eq 0 ]; then
  echo "✅ Migration applied successfully!"
  echo "✅ conversation_labels table created"
else
  echo "❌ Migration failed. Please check the error above."
  exit 1
fi
