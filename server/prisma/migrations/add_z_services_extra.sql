-- Add extra columns to services table
-- Runs AFTER add_services_and_project_invoice.sql which creates the services table

ALTER TABLE services ADD COLUMN IF NOT EXISTS use_delivery_date BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE services ADD COLUMN IF NOT EXISTS duration_days INT NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'BDT';
ALTER TABLE services MODIFY COLUMN delivery_start_date DATE NULL;
ALTER TABLE services MODIFY COLUMN delivery_end_date DATE NULL;
