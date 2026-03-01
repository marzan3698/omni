-- Add index on lead_import_id (idempotent - skip if index exists, MySQL compatible)
SET @index_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'leads'
    AND INDEX_NAME = 'idx_lead_import_id'
);
SET @sql = IF(@index_exists = 0,
  'ALTER TABLE `leads` ADD INDEX `idx_lead_import_id` (`lead_import_id`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
