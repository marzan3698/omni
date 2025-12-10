-- Add Payment Gateway and Payment System
-- This migration adds payment gateway management and payment tracking

-- 1. Create payment_gateways table
CREATE TABLE IF NOT EXISTS payment_gateways (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  account_type VARCHAR(50) NOT NULL,
  account_number VARCHAR(20) NOT NULL,
  instructions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_company_id (company_id),
  INDEX idx_is_active (is_active),
  CONSTRAINT fk_payment_gateways_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create payment_status enum
CREATE TABLE IF NOT EXISTS payment_status_temp (
  status ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
DROP TABLE IF EXISTS payment_status_temp;

-- 3. Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  invoice_id INT NOT NULL,
  project_id INT NULL,
  client_id INT NOT NULL,
  payment_gateway_id INT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  transaction_id VARCHAR(100),
  payment_method VARCHAR(50) NOT NULL,
  status ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') NOT NULL DEFAULT 'Pending',
  paid_by VARCHAR(255),
  notes TEXT,
  admin_notes TEXT,
  paid_at DATETIME,
  verified_at DATETIME,
  verified_by VARCHAR(36),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_company_id (company_id),
  INDEX idx_invoice_id (invoice_id),
  INDEX idx_project_id (project_id),
  INDEX idx_client_id (client_id),
  INDEX idx_status (status),
  INDEX idx_payment_gateway_id (payment_gateway_id),
  CONSTRAINT fk_payments_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT,
  CONSTRAINT fk_payments_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  CONSTRAINT fk_payments_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
  CONSTRAINT fk_payments_gateway FOREIGN KEY (payment_gateway_id) REFERENCES payment_gateways(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Update project_status enum to include StartedWorking
-- Note: MySQL doesn't support ALTER ENUM directly, so we need to recreate the column
-- This is a simplified version - in production, you may need to handle existing data more carefully

ALTER TABLE projects MODIFY COLUMN status ENUM('Draft', 'Submitted', 'StartedWorking', 'InProgress', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Draft';

