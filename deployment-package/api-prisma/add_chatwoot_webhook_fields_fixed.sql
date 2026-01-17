-- Migration: Add Chatwoot webhook fields and update SocialPlatform enum
-- MySQL-compatible version

-- 1. Add webhook_mode column (if not exists)
SET @dbname = DATABASE();
SET @tablename = 'integrations';
SET @columnname = 'webhook_mode';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' ENUM(\'local\', \'live\') DEFAULT \'local\' AFTER is_active')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 2. Add is_webhook_active column (if not exists)
SET @columnname = 'is_webhook_active';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' BOOLEAN DEFAULT FALSE AFTER webhook_mode')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 3. Update social_platform enum to include 'chatwoot'
ALTER TABLE social_conversations
  MODIFY COLUMN platform ENUM('facebook', 'chatwoot') NOT NULL;

