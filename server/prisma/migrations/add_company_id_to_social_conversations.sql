-- Add company_id column to social_conversations table
ALTER TABLE social_conversations
  ADD COLUMN IF NOT EXISTS company_id INT NOT NULL DEFAULT 1 AFTER id,
  ADD INDEX IF NOT EXISTS idx_company_id (company_id);

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

