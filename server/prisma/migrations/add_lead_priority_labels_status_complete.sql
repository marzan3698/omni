UPDATE `leads` l
INNER JOIN `lead_statuses` ls ON ls.company_id = l.company_id AND BINARY ls.code = BINARY l.status
SET l.status_id = ls.id
WHERE l.status_id IS NULL;

UPDATE `leads` l
INNER JOIN `lead_statuses` ls ON ls.company_id = l.company_id AND BINARY ls.code = 'New'
SET l.status_id = ls.id
WHERE l.status_id IS NULL;

ALTER TABLE `leads`
  MODIFY COLUMN `status_id` INT NOT NULL;

ALTER TABLE `leads`
  DROP COLUMN `status`;

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
