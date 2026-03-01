-- Add company_id column to tasks table for multi-tenancy support
ALTER TABLE `tasks` ADD COLUMN IF NOT EXISTS `company_id` INT NOT NULL DEFAULT 1 AFTER `id`;

ALTER TABLE `tasks` ADD INDEX IF NOT EXISTS `idx_company_id` (`company_id`);

-- Update existing tasks to have company_id = 1 (default company)
-- This assumes company with id=1 exists
UPDATE `tasks` SET `company_id` = 1 WHERE `company_id` IS NULL OR `company_id` = 0;

