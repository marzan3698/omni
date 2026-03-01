-- Add assignment fields to social_conversations table
ALTER TABLE `social_conversations` 
ADD COLUMN `assigned_to` INT NULL,
ADD COLUMN `assigned_at` DATETIME NULL;

-- Add index for assigned_to
ALTER TABLE `social_conversations`
ADD INDEX `idx_assigned_to` (`assigned_to`);

-- FK omitted (errno 150 on MariaDB)

