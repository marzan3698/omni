-- Replace single assigned_to with many-to-many lead_assignments

-- 1. Create lead_assignments table
CREATE TABLE IF NOT EXISTS lead_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  employee_id INT NOT NULL,
  assigned_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY lead_assignments_lead_id_employee_id_key (lead_id, employee_id),
  INDEX lead_assignments_lead_id_idx (lead_id),
  INDEX lead_assignments_employee_id_idx (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Migrate existing assigned_to data
INSERT IGNORE INTO lead_assignments (lead_id, employee_id)
SELECT id, assigned_to FROM leads WHERE assigned_to IS NOT NULL;

-- 3. Drop assigned_to from leads
-- Disable FK checks to allow drop regardless of auto-generated FK name (leads_ibfk_1 on MariaDB)
SET FOREIGN_KEY_CHECKS=0;
ALTER TABLE leads DROP FOREIGN KEY IF EXISTS leads_assigned_to_fkey;
ALTER TABLE leads DROP FOREIGN KEY IF EXISTS leads_ibfk_1;
ALTER TABLE leads DROP COLUMN IF EXISTS assigned_to;
SET FOREIGN_KEY_CHECKS=1;
