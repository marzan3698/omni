-- Add lead monitoring incharge fields to leads table
-- A lead gets "locked" to the first Lead Manager who changes its status.
-- That Lead Manager can transfer monitoring to another Lead Manager.

ALTER TABLE `leads`
  ADD COLUMN IF NOT EXISTS `lead_monitoring_user_id` VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS `lead_monitoring_assigned_at` DATETIME NULL,
  ADD COLUMN IF NOT EXISTS `lead_monitoring_transferred_at` DATETIME NULL,
  ADD INDEX IF NOT EXISTS `leads_lead_monitoring_user_id_idx` (`lead_monitoring_user_id`);

