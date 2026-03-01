-- Add Services table and update Invoices table
USE omni_db;

-- Create Services table
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  details TEXT NOT NULL,
  pricing DECIMAL(12, 2) NOT NULL,
  delivery_start_date DATE NOT NULL,
  delivery_end_date DATE NOT NULL,
  attributes JSON NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_company_id (company_id),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NOTE: ALTER TABLE projects is done in add_z_projects_status_enum.sql (after projects table is created)

-- Add project_id to invoices table
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS project_id INT AFTER client_id;

-- Add index for invoices
ALTER TABLE invoices
  ADD INDEX IF NOT EXISTS idx_project_id (project_id);


