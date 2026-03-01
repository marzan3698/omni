-- Add Excel to LeadSource enum and create LeadImport model for Excel lead import tracking

-- Step 1: Add Excel to lead_source enum
ALTER TABLE `leads`
MODIFY COLUMN `source` ENUM('Website', 'Referral', 'SocialMedia', 'Email', 'Phone', 'Inbox', 'FacebookPixel', 'Excel', 'Other') NOT NULL DEFAULT 'Website';

-- Step 2: Create lead_imports table
CREATE TABLE IF NOT EXISTS `lead_imports` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `company_id` INT NOT NULL,
  `uploaded_by` VARCHAR(36) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `total_rows` INT NOT NULL,
  `success_count` INT NOT NULL DEFAULT 0,
  `error_count` INT NOT NULL DEFAULT 0,
  `error_details` JSON NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_uploaded_by` (`uploaded_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Step 3: Add lead_import_id to leads table with index
ALTER TABLE `leads`
ADD COLUMN `lead_import_id` INT NULL,
ADD INDEX `idx_lead_import_id` (`lead_import_id`);

-- Step 4: FK omitted (errno 150 on MariaDB)
