-- Add read and seen status fields to social_messages table
-- Run this SQL directly in MySQL if Prisma migrate fails

-- Check if is_read column already exists
SET @column_exists_is_read = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'social_messages'
    AND COLUMN_NAME = 'is_read'
);

-- Add is_read column if it doesn't exist
SET @sql = IF(@column_exists_is_read = 0,
  'ALTER TABLE social_messages ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT FALSE AFTER image_url',
  'SELECT "Column is_read already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if read_at column already exists
SET @column_exists_read_at = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'social_messages'
    AND COLUMN_NAME = 'read_at'
);

-- Add read_at column if it doesn't exist
SET @sql = IF(@column_exists_read_at = 0,
  'ALTER TABLE social_messages ADD COLUMN read_at DATETIME NULL AFTER is_read',
  'SELECT "Column read_at already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if is_seen column already exists
SET @column_exists_is_seen = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'social_messages'
    AND COLUMN_NAME = 'is_seen'
);

-- Add is_seen column if it doesn't exist
SET @sql = IF(@column_exists_is_seen = 0,
  'ALTER TABLE social_messages ADD COLUMN is_seen BOOLEAN NOT NULL DEFAULT FALSE AFTER read_at',
  'SELECT "Column is_seen already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if seen_at column already exists
SET @column_exists_seen_at = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'social_messages'
    AND COLUMN_NAME = 'seen_at'
);

-- Add seen_at column if it doesn't exist
SET @sql = IF(@column_exists_seen_at = 0,
  'ALTER TABLE social_messages ADD COLUMN seen_at DATETIME NULL AFTER is_seen',
  'SELECT "Column seen_at already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index on is_read if it doesn't exist
SET @index_exists_is_read = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'social_messages'
    AND INDEX_NAME = 'idx_is_read'
);

SET @sql_index = IF(@index_exists_is_read = 0,
  'ALTER TABLE social_messages ADD INDEX idx_is_read (is_read)',
  'SELECT "Index idx_is_read already exists" AS message'
);

PREPARE stmt_index FROM @sql_index;
EXECUTE stmt_index;
DEALLOCATE PREPARE stmt_index;

-- Add index on is_seen if it doesn't exist
SET @index_exists_is_seen = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'social_messages'
    AND INDEX_NAME = 'idx_is_seen'
);

SET @sql_index = IF(@index_exists_is_seen = 0,
  'ALTER TABLE social_messages ADD INDEX idx_is_seen (is_seen)',
  'SELECT "Index idx_is_seen already exists" AS message'
);

PREPARE stmt_index FROM @sql_index;
EXECUTE stmt_index;
DEALLOCATE PREPARE stmt_index;

