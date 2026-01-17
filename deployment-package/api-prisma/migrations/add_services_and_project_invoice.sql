-- Add Services table and update Projects/Invoices tables
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
  INDEX idx_is_active (is_active),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add service_id and company_id to projects table
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS company_id INT AFTER id,
  ADD COLUMN IF NOT EXISTS service_id INT AFTER company_id,
  ADD COLUMN IF NOT EXISTS delivery_start_date DATE AFTER budget,
  ADD COLUMN IF NOT EXISTS delivery_end_date DATE AFTER delivery_start_date;

-- Add foreign keys for projects
ALTER TABLE projects
  ADD CONSTRAINT fk_projects_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_projects_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL;

-- Add indexes for projects
ALTER TABLE projects
  ADD INDEX IF NOT EXISTS idx_company_id (company_id),
  ADD INDEX IF NOT EXISTS idx_service_id (service_id);

-- Add project_id to invoices table
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS project_id INT AFTER client_id;

-- Add foreign key for invoices
ALTER TABLE invoices
  ADD CONSTRAINT fk_invoices_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- Add index for invoices
ALTER TABLE invoices
  ADD INDEX IF NOT EXISTS idx_project_id (project_id);

