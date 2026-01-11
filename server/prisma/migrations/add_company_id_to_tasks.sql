-- Add company_id column to tasks table for multi-tenancy support
ALTER TABLE `tasks` 
ADD COLUMN `company_id` INT NOT NULL DEFAULT 1 AFTER `id`;

-- Add index for company_id
ALTER TABLE `tasks`
ADD INDEX `idx_company_id` (`company_id`);

-- Add foreign key constraint
ALTER TABLE `tasks`
ADD CONSTRAINT `fk_tasks_company` 
FOREIGN KEY (`company_id`) 
REFERENCES `companies`(`id`) 
ON DELETE CASCADE;

-- Update existing tasks to have company_id = 1 (default company)
-- This assumes company with id=1 exists
UPDATE `tasks` SET `company_id` = 1 WHERE `company_id` IS NULL OR `company_id` = 0;

