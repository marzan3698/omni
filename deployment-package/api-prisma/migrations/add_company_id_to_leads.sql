-- Add company_id column to leads table for multi-tenancy support
ALTER TABLE `leads` 
ADD COLUMN `company_id` INT NOT NULL DEFAULT 1 AFTER `id`;

-- Add index for company_id
ALTER TABLE `leads`
ADD INDEX `idx_company_id` (`company_id`);

-- Add foreign key constraint for company_id
ALTER TABLE `leads`
ADD CONSTRAINT `fk_leads_company` 
FOREIGN KEY (`company_id`) 
REFERENCES `companies`(`id`) 
ON DELETE CASCADE;

-- Update existing leads to have company_id = 1 (default company)
-- This assumes company with id=1 exists
UPDATE `leads` SET `company_id` = 1 WHERE `company_id` IS NULL OR `company_id` = 0;

