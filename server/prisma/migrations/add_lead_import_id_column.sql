-- Add lead_import_id to leads (run each statement separately)
ALTER TABLE `leads` ADD COLUMN `lead_import_id` INT NULL;
