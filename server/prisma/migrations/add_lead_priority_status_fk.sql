ALTER TABLE `leads`
  ADD INDEX `idx_priority_id` (`priority_id`),
  ADD INDEX `idx_status_id` (`status_id`),
  ADD CONSTRAINT `fk_leads_priority` FOREIGN KEY (`priority_id`) REFERENCES `lead_priorities`(`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_leads_status` FOREIGN KEY (`status_id`) REFERENCES `lead_statuses`(`id`) ON DELETE RESTRICT;
