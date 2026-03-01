-- Safe migration for cPanel/live server: Lead Form Config only
-- Idempotent: can run multiple times without error
-- Use: node scripts/migrate-simple.cjs cpanel_lead_form_config_safe.sql

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
  INDEX `idx_company_id` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
