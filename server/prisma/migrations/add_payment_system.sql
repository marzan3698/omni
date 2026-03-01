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
  INDEX idx_is_active (is_active)
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
  INDEX idx_payment_gateway_id (payment_gateway_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Update project_status enum to include StartedWorking
-- NOTE: projects table is created by add_projects_and_campaign_clients.sql which runs later.
-- The ALTER TABLE projects is done in add_z_projects_status_enum.sql after projects exists.

