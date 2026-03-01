-- Migration: Add product_id to invoice_items for POS-style invoice creation
-- Links invoice line items to products when added from product catalog

USE omni_db;

ALTER TABLE invoice_items
ADD COLUMN IF NOT EXISTS product_id INT NULL AFTER invoice_id,
ADD INDEX IF NOT EXISTS idx_product_id (product_id);
