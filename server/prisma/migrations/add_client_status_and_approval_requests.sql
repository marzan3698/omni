-- Add Client.status (Processing/Active) and ClientApprovalRequest table for pending client approval flow

-- 1. Add status to clients (default Processing; existing clients become Active)
ALTER TABLE clients
  ADD COLUMN status ENUM('Processing', 'Active') NOT NULL DEFAULT 'Processing';

-- All existing clients were created before this feature; treat as Active
UPDATE clients SET status = 'Active';

ALTER TABLE clients MODIFY COLUMN status ENUM('Processing', 'Active') NOT NULL DEFAULT 'Processing';

-- 2. Create client_approval_requests table (FKs omitted to avoid errno 150 on MariaDB; app enforces integrity)
CREATE TABLE IF NOT EXISTS client_approval_requests (
  id INT NOT NULL AUTO_INCREMENT,
  company_id INT NOT NULL,
  lead_id INT NOT NULL,
  client_id INT NOT NULL,
  requested_by_user_id VARCHAR(36) NOT NULL,
  requested_by_employee_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  customer_points DECIMAL(12, 2) NOT NULL,
  status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
  approved_by_user_id VARCHAR(36) NULL,
  approved_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY lead_id (lead_id),
  UNIQUE KEY client_id (client_id),
  KEY company_id (company_id),
  KEY company_id_status (company_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
