-- Fix migration: Ensure enum has Pending status
-- Handles case where started_at column might already exist
-- This migration focuses on fixing the enum issue

-- Step 1: Add started_at column if it doesn't exist (using IGNORE to avoid error if exists)
-- We'll wrap this in a check, but MySQL doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- So we'll just try and ignore the error in the application layer
-- For manual execution, skip this if column exists:
-- ALTER TABLE `tasks` ADD COLUMN IF NOT EXISTS `started_at` DATETIME NULL AFTER `status`;

-- Step 2: Migrate enum to include Pending
-- Check current status and migrate safely

-- First, ensure all existing statuses are valid before we change enum
UPDATE `tasks`
SET `status` = 'StartedWorking'
WHERE `status` NOT IN ('Pending', 'StartedWorking', 'Complete', 'Cancel', 'Todo', 'InProgress', 'Done');

-- Temporarily change to VARCHAR to allow enum modification
ALTER TABLE `tasks`
MODIFY COLUMN `status` VARCHAR(50) NOT NULL;

-- Migrate old enum values to new ones
UPDATE `tasks`
SET `status` = CASE 
  WHEN `status` IN ('Todo', 'InProgress') THEN 'StartedWorking'
  WHEN `status` = 'Done' THEN 'Complete'
  WHEN `status` IN ('StartedWorking', 'Complete', 'Cancel') THEN `status`
  ELSE 'StartedWorking'
END;

-- Now change back to ENUM with new values (Pending first, as default)
ALTER TABLE `tasks`
MODIFY COLUMN `status` ENUM('Pending', 'StartedWorking', 'Complete', 'Cancel') NOT NULL DEFAULT 'Pending';

-- Step 3: Set startedAt for existing StartedWorking tasks that don't have it
-- (Only if column exists - we'll handle error gracefully)
UPDATE `tasks`
SET `started_at` = `updated_at`
WHERE `status` = 'StartedWorking' 
  AND (`started_at` IS NULL OR `started_at` = '0000-00-00 00:00:00');

-- Verify migration
SELECT status, COUNT(*) as count FROM tasks GROUP BY status;
