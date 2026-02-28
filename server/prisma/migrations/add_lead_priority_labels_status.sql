CREATE TABLE IF NOT EXISTS `lead_priorities` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `company_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_is_active` (`is_active`),
  CONSTRAINT `fk_lead_priorities_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `lead_labels` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `company_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `color` VARCHAR(20) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_is_active` (`is_active`),
  CONSTRAINT `fk_lead_labels_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `lead_statuses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `company_id` INT NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `code` VARCHAR(30) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_system` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_company_code` (`company_id`, `code`),
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_is_system` (`is_system`),
  CONSTRAINT `fk_lead_statuses_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `lead_statuses` (`company_id`, `name`, `code`, `sort_order`, `is_system`, `is_active`, `created_at`, `updated_at`)
SELECT c.`id`, 'Won', 'Won', 100, 1, 1, NOW(), NOW() FROM `companies` c
WHERE NOT EXISTS (SELECT 1 FROM `lead_statuses` ls WHERE ls.company_id = c.id AND ls.code = 'Won');

INSERT INTO `lead_statuses` (`company_id`, `name`, `code`, `sort_order`, `is_system`, `is_active`, `created_at`, `updated_at`)
SELECT c.`id`, 'Lost', 'Lost', 101, 1, 1, NOW(), NOW() FROM `companies` c
WHERE NOT EXISTS (SELECT 1 FROM `lead_statuses` ls WHERE ls.company_id = c.id AND ls.code = 'Lost');

INSERT INTO `lead_statuses` (`company_id`, `name`, `code`, `sort_order`, `is_system`, `is_active`, `created_at`, `updated_at`)
SELECT c.`id`, 'New', 'New', 0, 0, 1, NOW(), NOW() FROM `companies` c
WHERE NOT EXISTS (SELECT 1 FROM `lead_statuses` ls WHERE ls.company_id = c.id AND ls.code = 'New');

INSERT INTO `lead_statuses` (`company_id`, `name`, `code`, `sort_order`, `is_system`, `is_active`, `created_at`, `updated_at`)
SELECT c.`id`, 'Contacted', 'Contacted', 1, 0, 1, NOW(), NOW() FROM `companies` c
WHERE NOT EXISTS (SELECT 1 FROM `lead_statuses` ls WHERE ls.company_id = c.id AND ls.code = 'Contacted');

INSERT INTO `lead_statuses` (`company_id`, `name`, `code`, `sort_order`, `is_system`, `is_active`, `created_at`, `updated_at`)
SELECT c.`id`, 'Qualified', 'Qualified', 2, 0, 1, NOW(), NOW() FROM `companies` c
WHERE NOT EXISTS (SELECT 1 FROM `lead_statuses` ls WHERE ls.company_id = c.id AND ls.code = 'Qualified');

INSERT INTO `lead_statuses` (`company_id`, `name`, `code`, `sort_order`, `is_system`, `is_active`, `created_at`, `updated_at`)
SELECT c.`id`, 'Negotiation', 'Negotiation', 3, 0, 1, NOW(), NOW() FROM `companies` c
WHERE NOT EXISTS (SELECT 1 FROM `lead_statuses` ls WHERE ls.company_id = c.id AND ls.code = 'Negotiation');

ALTER TABLE `leads`
  ADD COLUMN `priority_id` INT NULL AFTER `interest_id`,
  ADD COLUMN `status_id` INT NULL AFTER `description`;

UPDATE `leads` l
INNER JOIN `lead_statuses` ls ON ls.company_id = l.company_id AND BINARY ls.code = BINARY l.status
SET l.status_id = ls.id;

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
  INDEX `idx_label_id` (`label_id`),
  CONSTRAINT `fk_lead_label_assignments_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lead_label_assignments_label` FOREIGN KEY (`label_id`) REFERENCES `lead_labels`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `leads`
  ADD INDEX `idx_priority_id` (`priority_id`),
  ADD INDEX `idx_status_id` (`status_id`),
  ADD CONSTRAINT `fk_leads_priority` FOREIGN KEY (`priority_id`) REFERENCES `lead_priorities`(`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_leads_status` FOREIGN KEY (`status_id`) REFERENCES `lead_statuses`(`id`) ON DELETE RESTRICT;
