-- Add Campaign-Product Many-to-Many Relationship
-- Run this SQL directly in MySQL if Prisma migrate fails

USE omni_db;

-- Create CampaignProduct junction table
CREATE TABLE IF NOT EXISTS campaign_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_campaign_product (campaign_id, product_id),
  INDEX idx_campaign_id (campaign_id),
  INDEX idx_product_id (product_id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

