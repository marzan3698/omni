-- Safe version: only run status migration if the old `status` column still exists

DROP PROCEDURE IF EXISTS migrate_lead_status_complete;

DELIMITER //
CREATE PROCEDURE migrate_lead_status_complete()
BEGIN
  -- Check if the old `status` column still exists on leads
  IF EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'leads'
      AND COLUMN_NAME = 'status'
  ) THEN
    -- Migrate existing status values to status_id
    UPDATE `leads` l
    INNER JOIN `lead_statuses` ls ON ls.company_id = l.company_id AND BINARY ls.code = BINARY l.status
    SET l.status_id = ls.id
    WHERE l.status_id IS NULL;

    UPDATE `leads` l
    INNER JOIN `lead_statuses` ls ON ls.company_id = l.company_id AND BINARY ls.code = 'New'
    SET l.status_id = ls.id
    WHERE l.status_id IS NULL;

    ALTER TABLE `leads` DROP COLUMN `status`;
  END IF;

  -- Ensure status_id is NOT NULL (safe to run even if already done)
  IF EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'leads'
      AND COLUMN_NAME = 'status_id'
      AND IS_NULLABLE = 'YES'
  ) THEN
    ALTER TABLE `leads` MODIFY COLUMN `status_id` INT NOT NULL;
  END IF;
END //
DELIMITER ;

CALL migrate_lead_status_complete();
DROP PROCEDURE IF EXISTS migrate_lead_status_complete;

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
