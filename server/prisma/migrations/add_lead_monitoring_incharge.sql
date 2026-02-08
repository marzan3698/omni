-- Add lead monitoring incharge fields to leads table
-- A lead gets "locked" to the first Lead Manager who changes its status.
-- That Lead Manager can transfer monitoring to another Lead Manager.

ALTER TABLE `leads`
  ADD COLUMN `lead_monitoring_user_id` VARCHAR(36) NULL AFTER `converted_to_client_id`,
  ADD COLUMN `lead_monitoring_assigned_at` DATETIME NULL AFTER `lead_monitoring_user_id`,
  ADD COLUMN `lead_monitoring_transferred_at` DATETIME NULL AFTER `lead_monitoring_assigned_at`,
  ADD INDEX `leads_lead_monitoring_user_id_idx` (`lead_monitoring_user_id`),
  ADD CONSTRAINT `leads_lead_monitoring_user_id_fkey`
    FOREIGN KEY (`lead_monitoring_user_id`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

