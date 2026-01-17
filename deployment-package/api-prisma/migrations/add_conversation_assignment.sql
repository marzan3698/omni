-- Add assignment fields to social_conversations table
ALTER TABLE `social_conversations` 
ADD COLUMN `assigned_to` INT NULL,
ADD COLUMN `assigned_at` DATETIME NULL;

-- Add index for assigned_to
ALTER TABLE `social_conversations`
ADD INDEX `idx_assigned_to` (`assigned_to`);

-- Add foreign key constraint
ALTER TABLE `social_conversations`
ADD CONSTRAINT `fk_social_conversations_assigned_to` 
FOREIGN KEY (`assigned_to`) 
REFERENCES `employees`(`id`) 
ON DELETE SET NULL;

