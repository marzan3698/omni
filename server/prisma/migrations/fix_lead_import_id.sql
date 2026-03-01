-- Fix: Add lead_import_id to leads (idempotent - skip if column exists)
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'leads'
    AND COLUMN_NAME = 'lead_import_id'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `leads` ADD COLUMN `lead_import_id` INT NULL, ADD INDEX `idx_lead_import_id` (`lead_import_id`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
