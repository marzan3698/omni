-- Safe/idempotent version.
-- NOTE: The previous migration (add_lead_priority_labels_status.sql) already:
--   1. Migrated status values to status_id
--   2. Made status_id NOT NULL
--   3. Dropped the old `status` column
-- So this file only ensures the lead_label_assignments table exists.

CREATE TABLE IF NOT EXISTS `lead_label_assignments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `lead_id` INT NOT NULL,
  `label_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_lead_label` (`lead_id`, `label_id`),
  INDEX `idx_lead_id` (`lead_id`),
  INDEX `idx_label_id` (`label_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

