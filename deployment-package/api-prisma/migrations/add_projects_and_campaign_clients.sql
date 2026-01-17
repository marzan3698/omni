-- Add Projects table and CampaignClients table
USE omni_db;

-- Create Projects table
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  budget DECIMAL(12, 2) NOT NULL,
  time VARCHAR(100) NOT NULL,
  status ENUM('Draft', 'Submitted', 'InProgress', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Draft',
  signature TEXT,
  document_url VARCHAR(500),
  signed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_client_id (client_id),
  INDEX idx_status (status),
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add title column if it doesn't exist (for existing tables)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT '' AFTER client_id;

-- Create CampaignClients table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS campaign_clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT NOT NULL,
  client_id VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_campaign_client (campaign_id, client_id),
  INDEX idx_campaign_id (campaign_id),
  INDEX idx_client_id (client_id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

