-- Fix: Add lead_import_id to leads - single statement
ALTER TABLE `leads` ADD COLUMN `lead_import_id` INT NULL, ADD INDEX `idx_lead_import_id` (`lead_import_id`);
