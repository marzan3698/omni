-- Add assigned_to to lead_meetings (runs after add_lead_meetings, add_company_id_to_employees)

-- 1. Add column as nullable first for backfill
ALTER TABLE lead_meetings ADD COLUMN assigned_to INT NULL;

-- 2. Backfill: first employee of same company, else first employee (requires employees.company_id from add_company_id_to_employees)
UPDATE lead_meetings m
INNER JOIN (
  SELECT m2.id AS meeting_id,
         COALESCE(
           (SELECT e.id FROM employees e WHERE e.company_id = m2.company_id LIMIT 1),
           (SELECT id FROM employees LIMIT 1)
         ) AS emp_id
  FROM lead_meetings m2
) AS sub ON sub.meeting_id = m.id
SET m.assigned_to = sub.emp_id
WHERE sub.emp_id IS NOT NULL AND m.assigned_to IS NULL;

UPDATE lead_meetings SET assigned_to = (SELECT id FROM employees LIMIT 1) WHERE assigned_to IS NULL;

-- 3. Make NOT NULL only if no NULLs remain (safe when table empty or no employees)
SET @null_count = (SELECT COUNT(*) FROM lead_meetings WHERE assigned_to IS NULL);
SET @sql_modify = IF(@null_count = 0, 'ALTER TABLE lead_meetings MODIFY COLUMN assigned_to INT NOT NULL', 'SELECT 1');
PREPARE stmt_modify FROM @sql_modify;
EXECUTE stmt_modify;
DEALLOCATE PREPARE stmt_modify;

-- 4. Add index (idempotent for MySQL)
SET @idx_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lead_meetings' AND INDEX_NAME = 'lead_meetings_assigned_to_idx'
);
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX lead_meetings_assigned_to_idx ON lead_meetings(assigned_to)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
