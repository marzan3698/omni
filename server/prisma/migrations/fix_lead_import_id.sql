-- Fix: Add lead_import_id to leads (idempotent - safe to run multiple times)
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `lead_import_id` INT NULL;
ALTER TABLE `leads` ADD INDEX IF NOT EXISTS `idx_lead_import_id` (`lead_import_id`);

