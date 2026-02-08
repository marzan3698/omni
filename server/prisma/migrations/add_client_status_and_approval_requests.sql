-- Add Client.status (Processing/Active) and ClientApprovalRequest table for pending client approval flow

-- 1. Add status to clients (default Processing; existing clients become Active)
ALTER TABLE clients
  ADD COLUMN status ENUM('Processing', 'Active') NOT NULL DEFAULT 'Processing';

-- All existing clients were created before this feature; treat as Active
UPDATE clients SET status = 'Active';

ALTER TABLE clients MODIFY COLUMN status ENUM('Processing', 'Active') NOT NULL DEFAULT 'Processing';

-- 2. Create client_approval_requests table
CREATE TABLE client_approval_requests (
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
  KEY company_id_status (company_id, status),
  CONSTRAINT client_approval_requests_company_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT client_approval_requests_lead_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT client_approval_requests_client_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT client_approval_requests_requested_by_user_fkey FOREIGN KEY (requested_by_user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT client_approval_requests_requested_by_employee_fkey FOREIGN KEY (requested_by_employee_id) REFERENCES employees(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT client_approval_requests_approved_by_user_fkey FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);
