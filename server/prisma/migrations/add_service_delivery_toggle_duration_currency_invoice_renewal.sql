-- Service delivery columns and invoice renewal
-- NOTE: services table is created by add_services_and_project_invoice.sql which runs after this file alphabetically.
-- All ALTER TABLE services statements are in add_z_services_extra.sql which runs last.

-- Invoice: Add renewedFromId for renewal tracking
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS renewed_from_id INT NULL;

