-- Add Campaigns table and update Leads table
USE omni_db;

-- Create Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget DECIMAL(12, 2) NOT NULL,
  type ENUM('reach', 'sale', 'research') NOT NULL DEFAULT 'sale',
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_company_id (company_id),
  INDEX idx_type (type),
  INDEX idx_start_date (start_date),
  INDEX idx_end_date (end_date),
  INDEX idx_is_active (is_active),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add campaign_id to leads table (if column doesn't exist)
-- Check if column exists first
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'omni_db' 
  AND TABLE_NAME = 'leads' 
  AND COLUMN_NAME = 'campaign_id';

-- Only add column if it doesn't exist
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE leads ADD COLUMN campaign_id INT NULL, ADD INDEX idx_campaign_id (campaign_id)',
  'SELECT "Column campaign_id already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint (if it doesn't exist)
SET @fk_exists = 0;
SELECT COUNT(*) INTO @fk_exists
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'omni_db'
  AND TABLE_NAME = 'leads'
  AND CONSTRAINT_NAME = 'fk_lead_campaign';

SET @sql_fk = IF(@fk_exists = 0,
  'ALTER TABLE leads ADD CONSTRAINT fk_lead_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL',
  'SELECT "Foreign key fk_lead_campaign already exists" as message');

PREPARE stmt_fk FROM @sql_fk;
EXECUTE stmt_fk;
DEALLOCATE PREPARE stmt_fk;

