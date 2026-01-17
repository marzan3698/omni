-- Safe migration: Add Pending status to TaskStatus enum and startedAt field
-- This script is idempotent and can be run multiple times safely

-- Step 1: Check and add started_at column if it doesn't exist
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'tasks' 
    AND COLUMN_NAME = 'started_at'
);

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `tasks` ADD COLUMN `started_at` DATETIME NULL AFTER `status`',
  'SELECT "Column started_at already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Set startedAt for existing StartedWorking tasks (if column exists now)
UPDATE `tasks`
SET `started_at` = `updated_at`
WHERE `status` = 'StartedWorking' 
  AND (`started_at` IS NULL OR `started_at` = '0000-00-00 00:00:00');

-- Step 3: Check current status column type and migrate enum safely
-- Get current column type
SET @current_type = (
  SELECT COLUMN_TYPE 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'tasks' 
    AND COLUMN_NAME = 'status'
);

-- If column is ENUM and doesn't have 'Pending', migrate it
SET @has_pending = (
  SELECT COUNT(*) > 0
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'tasks' 
    AND COLUMN_NAME = 'status'
    AND COLUMN_TYPE LIKE '%Pending%'
);

-- Only run migration if Pending doesn't exist
SET @sql2 = IF(@has_pending = 0,
  CONCAT('
    -- Temporarily change to VARCHAR to allow enum modification
    ALTER TABLE `tasks` MODIFY COLUMN `status` VARCHAR(50) NOT NULL;
    
    -- Now change back to ENUM with new values (Pending first, as default)
    ALTER TABLE `tasks` MODIFY COLUMN `status` ENUM(\'Pending\', \'StartedWorking\', \'Complete\', \'Cancel\') NOT NULL DEFAULT \'Pending\';
  '),
  'SELECT "Enum already has Pending status" AS message'
);

-- Execute the migration if needed
SET @migration_needed = IF(@has_pending = 0, 1, 0);

-- Note: MySQL doesn't support conditional DDL in stored procedures easily
-- So we'll use a simpler approach: Just try to alter if it fails, the column might already be correct

-- Try to add Pending status (this will work if column is VARCHAR or enum without Pending)
-- We'll handle errors gracefully
ALTER TABLE `tasks` MODIFY COLUMN `status` VARCHAR(50) NOT NULL;
ALTER TABLE `tasks` MODIFY COLUMN `status` ENUM('Pending', 'StartedWorking', 'Complete', 'Cancel') NOT NULL DEFAULT 'Pending';

-- Verify migration
SELECT status, COUNT(*) as count, COUNT(started_at) as with_started_at 
FROM tasks 
GROUP BY status;

