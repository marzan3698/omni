-- Add image_url column to social_messages table
-- This migration adds support for image attachments in messages

-- Check if image_url column already exists
SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'social_messages'
    AND COLUMN_NAME = 'image_url'
);

-- Add image_url column if it doesn't exist
SET @sql = IF(@column_exists = 0,
  'ALTER TABLE social_messages 
   ADD COLUMN image_url VARCHAR(500) NULL AFTER content',
  'SELECT "Column image_url already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index on image_url for faster queries (optional but recommended)
SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'social_messages'
    AND INDEX_NAME = 'idx_image_url'
);

SET @sql_index = IF(@index_exists = 0,
  'ALTER TABLE social_messages ADD INDEX idx_image_url (image_url)',
  'SELECT "Index idx_image_url already exists" AS message'
);

PREPARE stmt_index FROM @sql_index;
EXECUTE stmt_index;
DEALLOCATE PREPARE stmt_index;

