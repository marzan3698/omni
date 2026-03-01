-- Migration: Add projectId to campaigns, add campaign_invoices table

USE omni_db;

-- Step 1: Add project_id column to campaigns (nullable - no data to migrate on fresh install)
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS project_id INT NULL AFTER company_id;

ALTER TABLE campaigns
ADD INDEX IF NOT EXISTS idx_project_id (project_id);

-- NOTE: The UPDATE to populate project_id from projects is skipped because:
-- 1. On a fresh install there are no campaigns to update
-- 2. projects.company_id column doesn't exist yet at this point (added in add_z_projects_status_enum.sql)

-- Step 2: Remove employee assignment tables (already run by add_campaign_employees / add_campaign_groups)
DROP TABLE IF EXISTS campaign_employees;
DROP TABLE IF EXISTS campaign_groups;

-- Step 3: Create campaign_invoices junction table
CREATE TABLE IF NOT EXISTS campaign_invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT NOT NULL,
  invoice_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_campaign_invoice (campaign_id, invoice_id),
  INDEX idx_campaign_id (campaign_id),
  INDEX idx_invoice_id (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


