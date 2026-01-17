-- Create Lead Categories table
CREATE TABLE IF NOT EXISTS lead_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_company_id (company_id),
  INDEX idx_is_active (is_active),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Lead Interests table
CREATE TABLE IF NOT EXISTS lead_interests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_company_id (company_id),
  INDEX idx_is_active (is_active),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create System Settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  `key` VARCHAR(100) NOT NULL,
  value TEXT NOT NULL,
  description VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_company_key (company_id, `key`),
  INDEX idx_company_id (company_id),
  INDEX idx_key (`key`),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add new columns to leads table
ALTER TABLE leads 
  ADD COLUMN customer_name VARCHAR(255) NULL,
  ADD COLUMN phone VARCHAR(50) NULL,
  ADD COLUMN category_id INT NULL,
  ADD COLUMN interest_id INT NULL;

-- Add indexes
ALTER TABLE leads
  ADD INDEX idx_category_id (category_id),
  ADD INDEX idx_interest_id (interest_id);

-- Add foreign keys
ALTER TABLE leads
  ADD CONSTRAINT fk_lead_category 
    FOREIGN KEY (category_id) REFERENCES lead_categories(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_lead_interest 
    FOREIGN KEY (interest_id) REFERENCES lead_interests(id) ON DELETE SET NULL;

