-- Migration: Add projectId to campaigns, remove employee/group relations, add campaign_invoices table
-- This connects campaigns to projects and their associated invoices

USE omni_db;

-- Step 1: Add project_id column to campaigns (nullable first, then we'll make it required)
ALTER TABLE campaigns 
ADD COLUMN project_id INT NULL AFTER company_id;

-- For existing campaigns, assign them to the first available project (if exists)
-- Update this based on your actual data requirements
UPDATE campaigns c
SET c.project_id = (
  SELECT p.id FROM projects p 
  WHERE p.company_id = c.company_id 
  LIMIT 1
)
WHERE c.project_id IS NULL;

-- Now make project_id required and add foreign key
ALTER TABLE campaigns
MODIFY COLUMN project_id INT NOT NULL,
ADD INDEX idx_project_id (project_id),
ADD FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Step 2: Remove employee assignment tables (campaign_employees, campaign_groups)
-- Note: Drop foreign keys first, then tables
DROP TABLE IF EXISTS campaign_employees;
DROP TABLE IF EXISTS campaign_groups;

-- Step 3: Create campaign_invoices junction table
CREATE TABLE IF NOT EXISTS campaign_invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT NOT NULL,
  invoice_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  UNIQUE KEY unique_campaign_invoice (campaign_id, invoice_id),
  INDEX idx_campaign_id (campaign_id),
  INDEX idx_invoice_id (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: You may need to populate existing campaigns with a default project_id
-- Or handle this manually for existing data

