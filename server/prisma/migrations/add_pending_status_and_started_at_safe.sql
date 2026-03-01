-- Safe migration: Add Pending status to TaskStatus enum and started_at field
-- Rewritten to avoid PREPARE/EXECUTE/CONCAT which breaks in Node.js SQL runner

-- Step 1: Add started_at column if it doesn't exist (IF NOT EXISTS is MariaDB-safe)
ALTER TABLE `tasks` ADD COLUMN IF NOT EXISTS `started_at` DATETIME NULL AFTER `status`;

-- Step 2: Set startedAt for existing StartedWorking tasks
UPDATE `tasks`
SET `started_at` = `updated_at`
WHERE `status` = 'StartedWorking'
  AND (`started_at` IS NULL OR `started_at` = '0000-00-00 00:00:00');

-- Step 3: Migrate status enum safely
-- First change to VARCHAR to allow adding new enum values
ALTER TABLE `tasks` MODIFY COLUMN `status` VARCHAR(50) NOT NULL;

-- Now change back to ENUM with Pending added
ALTER TABLE `tasks` MODIFY COLUMN `status` ENUM('Pending', 'StartedWorking', 'Complete', 'Cancel') NOT NULL DEFAULT 'Pending';


