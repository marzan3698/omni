-- Update TaskStatus enum and migrate existing task data
-- Changes: Todo/InProgress → StartedWorking, Done → Complete
-- Add new status: Cancel

-- Step 1: Migrate existing data before altering enum
-- Update Todo and InProgress to StartedWorking
UPDATE `tasks` SET `status` = 'StartedWorking' WHERE `status` IN ('Todo', 'InProgress');

-- Update Done to Complete
UPDATE `tasks` SET `status` = 'Complete' WHERE `status` = 'Done';

-- Step 2: Alter enum to add new values (MySQL requires MODIFY COLUMN)
-- First, we need to change the column to allow the new enum values
-- MySQL doesn't support direct enum modification, so we need to:
-- 1. Alter column to VARCHAR temporarily
-- 2. Update any invalid values
-- 3. Alter back to ENUM with new values

-- Temporarily change to VARCHAR to allow enum modification
ALTER TABLE `tasks` 
MODIFY COLUMN `status` VARCHAR(50) NOT NULL;

-- Update to new enum values (data should already be migrated, but ensure consistency)
UPDATE `tasks` 
SET `status` = 'StartedWorking' 
WHERE `status` NOT IN ('StartedWorking', 'Complete', 'Cancel');

-- Now change back to ENUM with new values
ALTER TABLE `tasks` 
MODIFY COLUMN `status` ENUM('StartedWorking', 'Complete', 'Cancel') NOT NULL DEFAULT 'StartedWorking';

-- Verify migration
-- SELECT status, COUNT(*) as count FROM tasks GROUP BY status;

