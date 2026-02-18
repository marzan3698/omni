-- Migration: Add service_id to invoice_items for Products + Services invoice creation
-- Links invoice line items to services when added from service catalog

USE omni_db;

ALTER TABLE invoice_items
ADD COLUMN service_id INT NULL AFTER product_id,
ADD INDEX idx_service_id (service_id),
ADD FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL;
