-- Add company_id column to social_conversations table
-- This migration adds company_id to support multi-tenancy

-- Check if company_id column already exists, if not add it
SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'social_conversations'
    AND COLUMN_NAME = 'company_id'
);

-- Add company_id column if it doesn't exist
SET @sql = IF(@column_exists = 0,
  'ALTER TABLE social_conversations 
   ADD COLUMN company_id INT NOT NULL DEFAULT 1 AFTER id,
   ADD INDEX idx_company_id (company_id),
   ADD CONSTRAINT fk_social_conversations_company 
   FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE',
  'SELECT "Column company_id already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing records to use companyId from integrations
-- For Chatwoot conversations, try to find matching integration
UPDATE social_conversations sc
LEFT JOIN integrations i ON (
  i.provider = 'chatwoot' 
  AND sc.external_user_id LIKE CONCAT('chatwoot_%')
)
SET sc.company_id = COALESCE(i.company_id, 1)
WHERE sc.company_id = 1 OR sc.company_id IS NULL;

-- For Facebook conversations, try to find matching integration
UPDATE social_conversations sc
LEFT JOIN integrations i ON (
  i.provider = 'facebook' 
  AND sc.platform = 'facebook'
)
SET sc.company_id = COALESCE(i.company_id, 1)
WHERE (sc.company_id = 1 OR sc.company_id IS NULL) 
  AND sc.platform = 'facebook';

-- Remove DEFAULT constraint after updating existing records
-- Note: This requires MySQL 8.0.13+ for ALTER COLUMN
-- For older versions, this will be handled by Prisma schema
ALTER TABLE social_conversations 
MODIFY COLUMN company_id INT NOT NULL;

