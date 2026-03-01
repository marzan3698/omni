-- All ALTER TABLE projects statements consolidated here.
-- This runs AFTER add_projects_and_campaign_clients.sql which creates the projects table.

-- Add service_id, company_id, delivery dates to projects (from add_services_and_project_invoice.sql)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS company_id INT AFTER id,
  ADD COLUMN IF NOT EXISTS service_id INT AFTER company_id,
  ADD COLUMN IF NOT EXISTS delivery_start_date DATE AFTER budget,
  ADD COLUMN IF NOT EXISTS delivery_end_date DATE AFTER delivery_start_date;

ALTER TABLE projects
  ADD INDEX IF NOT EXISTS idx_company_id (company_id),
  ADD INDEX IF NOT EXISTS idx_service_id (service_id);

-- Update project status enum to include StartedWorking (from add_payment_system.sql)
ALTER TABLE projects MODIFY COLUMN status ENUM('Draft', 'Submitted', 'StartedWorking', 'InProgress', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Draft';

