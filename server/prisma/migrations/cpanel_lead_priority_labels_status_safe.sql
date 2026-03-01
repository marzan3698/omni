-- Safe migration for cPanel/live server: Lead Priority, Labels, Status tables only
-- Does NOT alter leads table - run this first. If leads has old 'status' column, run MANUAL_DATABASE_MIGRATION.sql Section C separately.
-- Use: node scripts/migrate-simple.cjs cpanel_lead_priority_labels_status_safe.sql

CREATE TABLE IF NOT EXISTS `lead_priorities` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `company_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `lead_labels` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `company_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `color` VARCHAR(20) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `lead_statuses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `company_id` INT NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `code` VARCHAR(30) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_system` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_company_code` (`company_id`, `code`),
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_is_system` (`is_system`)
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
