-- =============================================================================
-- MANUAL DATABASE MIGRATION - Run in phpMyAdmin
-- =============================================================================
-- Execute these SQL commands in ORDER. If a statement fails (e.g. "already exists"),
-- skip it and continue. Each section is idempotent where possible.
-- Replace YOUR_DATABASE_NAME with your actual database name if needed.
-- =============================================================================

-- =============================================================================
-- SECTION A: Excel Lead Import
-- =============================================================================

-- A1: Add Excel to lead source enum
ALTER TABLE `leads` MODIFY COLUMN `source` ENUM('Website', 'Referral', 'SocialMedia', 'Email', 'Phone', 'Inbox', 'FacebookPixel', 'Excel', 'Other') NOT NULL DEFAULT 'Website';

-- A2: Create lead_imports table
CREATE TABLE IF NOT EXISTS `lead_imports` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `company_id` INT NOT NULL,
  `uploaded_by` VARCHAR(36) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `total_rows` INT NOT NULL,
  `success_count` INT NOT NULL DEFAULT 0,
  `error_count` INT NOT NULL DEFAULT 0,
  `error_details` JSON NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_uploaded_by` (`uploaded_by`),
  CONSTRAINT `fk_lead_imports_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lead_imports_user` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- A3: Add lead_import_id to leads (skip if column exists - error is OK)
ALTER TABLE `leads` ADD COLUMN `lead_import_id` INT NULL;

-- A4: Add index and FK for lead_import_id (skip if already exists)
ALTER TABLE `leads` ADD INDEX `idx_lead_import_id` (`lead_import_id`);
ALTER TABLE `leads` ADD CONSTRAINT `fk_leads_lead_import` FOREIGN KEY (`lead_import_id`) REFERENCES `lead_imports`(`id`) ON DELETE SET NULL;


-- =============================================================================
-- SECTION B: Lead Form Config (Website Embed Form)
-- =============================================================================

CREATE TABLE IF NOT EXISTS `lead_form_configs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `company_id` INT NOT NULL,
  `slug` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `field_config` JSON NOT NULL DEFAULT ('{}'),
  `design_config` JSON NOT NULL DEFAULT ('{}'),
  `attribution_user_id` VARCHAR(36) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `slug` (`slug`),
  INDEX `idx_company_id` (`company_id`),
  CONSTRAINT `fk_lead_form_configs_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =============================================================================
-- SECTION C: Lead Priority, Labels, Status (Configurable)
-- =============================================================================
-- IMPORTANT: Only run Section C if your `leads` table has a `status` column
-- (VARCHAR/ENUM with values like 'New','Contacted','Won','Lost').
-- If you already have `status_id` and `priority_id` on leads, SKIP Section C.
-- =============================================================================

-- C1: Create lead_priorities
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
  INDEX `idx_is_active` (`is_active`),
  CONSTRAINT `fk_lead_priorities_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- C2: Create lead_labels
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
  INDEX `idx_is_active` (`is_active`),
  CONSTRAINT `fk_lead_labels_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- C3: Create lead_statuses
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
  INDEX `idx_is_system` (`is_system`),
  CONSTRAINT `fk_lead_statuses_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- C4: Seed lead_statuses (Won, Lost, New, Contacted, Qualified, Negotiation) per company
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

-- C5: Add priority_id and status_id to leads (ONLY if leads has 'status' column - skip if you get "Duplicate column" error)
-- First check: DESCRIBE leads; — if you see 'status' column, run C5 and C6. If you see 'status_id', skip.
ALTER TABLE `leads` ADD COLUMN `priority_id` INT NULL;
ALTER TABLE `leads` ADD COLUMN `status_id` INT NULL;

-- C6: Migrate old status to status_id (map enum to lead_statuses)
UPDATE `leads` l
INNER JOIN `lead_statuses` ls ON ls.company_id = l.company_id AND BINARY ls.code = BINARY l.status
SET l.status_id = ls.id
WHERE l.status_id IS NULL;

UPDATE `leads` l
INNER JOIN `lead_statuses` ls ON ls.company_id = l.company_id AND ls.code = 'New'
SET l.status_id = ls.id
WHERE l.status_id IS NULL;

ALTER TABLE `leads` MODIFY COLUMN `status_id` INT NOT NULL;
ALTER TABLE `leads` DROP COLUMN `status`;

-- C7: Create lead_label_assignments
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

-- C8: Add FKs for priority_id and status_id
ALTER TABLE `leads` ADD INDEX `idx_priority_id` (`priority_id`);
ALTER TABLE `leads` ADD INDEX `idx_status_id` (`status_id`);
ALTER TABLE `leads` ADD CONSTRAINT `fk_leads_priority` FOREIGN KEY (`priority_id`) REFERENCES `lead_priorities`(`id`) ON DELETE SET NULL;
ALTER TABLE `leads` ADD CONSTRAINT `fk_leads_status` FOREIGN KEY (`status_id`) REFERENCES `lead_statuses`(`id`) ON DELETE RESTRICT;


-- =============================================================================
-- SECTION E: Integration Webhook Log (Admin Dashboard Error History)
-- =============================================================================

CREATE TABLE IF NOT EXISTS `integration_webhook_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `integration_id` INT NOT NULL,
  `success` TINYINT(1) NOT NULL,
  `error_message` TEXT NULL,
  `payload_snippet` VARCHAR(500) NULL,
  `source` VARCHAR(50) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_integration_id` (`integration_id`),
  INDEX `idx_created_at` (`created_at`),
  CONSTRAINT `fk_integration_webhook_logs_integration`
    FOREIGN KEY (`integration_id`) REFERENCES `integrations`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- Run these to verify:
-- SHOW TABLES LIKE 'lead_imports';
-- SHOW TABLES LIKE 'lead_form_configs';
-- SHOW TABLES LIKE 'integration_webhook_logs';
-- SHOW TABLES LIKE 'lead_priorities';
-- SHOW TABLES LIKE 'lead_labels';
-- SHOW TABLES LIKE 'lead_statuses';
-- SHOW TABLES LIKE 'lead_label_assignments';
-- DESCRIBE leads;  (should have lead_import_id, priority_id, status_id; no 'status' column)
-- =============================================================================
