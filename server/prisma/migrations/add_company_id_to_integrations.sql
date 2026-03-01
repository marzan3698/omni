-- Add company_id column to integrations table (FK omitted to avoid errno 150 on MariaDB)
ALTER TABLE integrations 
ADD COLUMN IF NOT EXISTS company_id INT NOT NULL DEFAULT 1 AFTER id,
ADD COLUMN IF NOT EXISTS webhook_mode ENUM('local', 'live') NULL DEFAULT 'local' AFTER is_active,
ADD COLUMN IF NOT EXISTS is_webhook_active BOOLEAN NOT NULL DEFAULT FALSE AFTER webhook_mode;

-- Drop old unique constraint and add new one with company_id
ALTER TABLE integrations
DROP INDEX IF EXISTS unique_provider_page;

ALTER TABLE integrations
ADD UNIQUE KEY unique_company_provider_page (company_id, provider, page_id);

-- Add index on company_id
ALTER TABLE integrations
ADD INDEX IF NOT EXISTS idx_company_id (company_id);
