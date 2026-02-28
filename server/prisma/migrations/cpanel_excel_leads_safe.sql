-- Safe migration for cPanel/live server: Excel Lead Import only
-- Idempotent: can run multiple times without error
-- Use: node scripts/migrate-simple.cjs cpanel_excel_leads_safe.sql

-- Step 1: Add Excel to source enum (skip if already exists)
ALTER TABLE `leads` MODIFY COLUMN `source` ENUM('Website', 'Referral', 'SocialMedia', 'Email', 'Phone', 'Inbox', 'FacebookPixel', 'Excel', 'Other') NOT NULL DEFAULT 'Website';

-- Step 2: Create lead_imports table (IF NOT EXISTS = safe)
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
  INDEX `idx_uploaded_by` (`uploaded_by`),
  CONSTRAINT `fk_lead_imports_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lead_imports_user` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
