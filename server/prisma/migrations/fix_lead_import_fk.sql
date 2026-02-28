-- Add FK for lead_import_id
ALTER TABLE `leads` ADD CONSTRAINT `fk_leads_lead_import` FOREIGN KEY (`lead_import_id`) REFERENCES `lead_imports`(`id`) ON DELETE SET NULL;
