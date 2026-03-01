-- Single migration: create invoice_items with all columns, or add missing ones
CREATE TABLE IF NOT EXISTS invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  product_id INT NULL,
  service_id INT NULL,
  description VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_invoice_id (invoice_id),
  INDEX idx_product_id (product_id),
  INDEX idx_service_id (service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- For existing tables missing product_id/service_id (from partial runs)
ALTER TABLE invoice_items
  ADD COLUMN IF NOT EXISTS product_id INT NULL,
  ADD COLUMN IF NOT EXISTS service_id INT NULL,
  ADD INDEX IF NOT EXISTS idx_product_id (product_id),
  ADD INDEX IF NOT EXISTS idx_service_id (service_id);
