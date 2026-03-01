-- Add company_id to employees for multi-tenancy (init.sql creates employees without it)

SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'employees' AND COLUMN_NAME = 'company_id'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE employees ADD COLUMN company_id INT NOT NULL DEFAULT 1 AFTER user_id, ADD INDEX idx_company_id (company_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
