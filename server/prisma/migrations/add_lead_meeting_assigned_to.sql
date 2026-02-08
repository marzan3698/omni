-- Add assigned_to to lead_meetings for meeting assignment

-- 1. Add column as nullable first for backfill
ALTER TABLE lead_meetings ADD COLUMN assigned_to INT NULL;

-- 2. Backfill: set to first employee of the same company (per meeting)
UPDATE lead_meetings m
INNER JOIN (
  SELECT m2.id AS meeting_id,
         (SELECT e.id FROM employees e WHERE e.company_id = m2.company_id LIMIT 1) AS emp_id
  FROM lead_meetings m2
) AS sub ON sub.meeting_id = m.id
SET m.assigned_to = sub.emp_id
WHERE sub.emp_id IS NOT NULL;

-- 3. If any meeting still has NULL (no employees in company), use first employee from any company
UPDATE lead_meetings SET assigned_to = (SELECT id FROM employees LIMIT 1) WHERE assigned_to IS NULL;

-- 4. Make NOT NULL and add FK (skip if no employees exist - leave NULL for that edge case)
ALTER TABLE lead_meetings MODIFY COLUMN assigned_to INT NOT NULL;

ALTER TABLE lead_meetings
  ADD CONSTRAINT lead_meetings_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES employees(id) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX lead_meetings_assigned_to_idx ON lead_meetings(assigned_to);
