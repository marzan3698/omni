-- Add Pending status to TaskStatus enum and startedAt field
-- Changes: Add Pending as default status, add started_at column
-- Migrate existing StartedWorking tasks: Set startedAt = updatedAt

-- Step 1: Add started_at column first (before enum migration)
ALTER TABLE `tasks`
ADD COLUMN `started_at` DATETIME NULL AFTER `status`;

-- Step 2: Set startedAt for existing StartedWorking tasks
UPDATE `tasks`
SET `started_at` = `updated_at`
WHERE `status` = 'StartedWorking' AND `started_at` IS NULL;

-- Step 3: Migrate enum to add Pending status
-- MySQL doesn't support direct enum modification, so we need to:
-- 1. Temporarily change to VARCHAR
-- 2. Update any invalid values
-- 3. Alter back to ENUM with new values

-- Temporarily change to VARCHAR to allow enum modification
ALTER TABLE `tasks`
MODIFY COLUMN `status` VARCHAR(50) NOT NULL;

-- Update to new enum values (ensure StartedWorking, Complete, Cancel remain valid)
-- We don't need to update existing data since we're just adding Pending

-- Now change back to ENUM with new values (Pending first, as default)
ALTER TABLE `tasks`
MODIFY COLUMN `status` ENUM('Pending', 'StartedWorking', 'Complete', 'Cancel') NOT NULL DEFAULT 'Pending';

-- Step 4: Update default status to Pending for new tasks
-- The default is already set in the ALTER statement above, but ensure existing rows maintain their status
-- Existing StartedWorking, Complete, Cancel tasks should remain unchanged

-- Verify migration
-- SELECT status, COUNT(*) as count, COUNT(started_at) as with_started_at FROM tasks GROUP BY status;

