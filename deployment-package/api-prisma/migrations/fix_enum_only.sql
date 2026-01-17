-- Fix enum only: Add Pending status to TaskStatus enum
-- This assumes started_at column already exists

-- Step 1: Temporarily change to VARCHAR to allow enum modification
ALTER TABLE `tasks`
MODIFY COLUMN `status` VARCHAR(50) NOT NULL;

-- Step 2: Migrate old enum values to new ones (if any exist)
UPDATE `tasks`
SET `status` = CASE 
  WHEN `status` IN ('Todo', 'InProgress') THEN 'StartedWorking'
  WHEN `status` = 'Done' THEN 'Complete'
  WHEN `status` IN ('StartedWorking', 'Complete', 'Cancel') THEN `status`
  ELSE 'StartedWorking'
END
WHERE `status` NOT IN ('Pending', 'StartedWorking', 'Complete', 'Cancel');

-- Step 3: Change back to ENUM with new values (Pending first, as default)
ALTER TABLE `tasks`
MODIFY COLUMN `status` ENUM('Pending', 'StartedWorking', 'Complete', 'Cancel') NOT NULL DEFAULT 'Pending';

-- Step 4: Set startedAt for existing StartedWorking tasks that don't have it
UPDATE `tasks`
SET `started_at` = `updated_at`
WHERE `status` = 'StartedWorking' 
  AND (`started_at` IS NULL OR `started_at` = '0000-00-00 00:00:00');

-- Verify migration
SELECT status, COUNT(*) as count, COUNT(started_at) as with_started_at 
FROM tasks 
GROUP BY status;

