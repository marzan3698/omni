-- Add company_id column to integrations table
ALTER TABLE integrations 
ADD COLUMN company_id INT NOT NULL DEFAULT 1 AFTER id,
ADD COLUMN webhook_mode ENUM('local', 'live') NULL DEFAULT 'local' AFTER is_active,
ADD COLUMN is_webhook_active BOOLEAN NOT NULL DEFAULT FALSE AFTER webhook_mode;

-- Add foreign key constraint
ALTER TABLE integrations
ADD CONSTRAINT fk_integrations_company 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Drop old unique constraint and add new one with company_id
ALTER TABLE integrations
DROP INDEX IF EXISTS unique_provider_page;

ALTER TABLE integrations
ADD UNIQUE KEY unique_company_provider_page (company_id, provider, page_id);

-- Add index on company_id
ALTER TABLE integrations
ADD INDEX idx_company_id (company_id);
