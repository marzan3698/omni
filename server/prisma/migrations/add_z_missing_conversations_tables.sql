-- ============================================================
-- Fix missing tables and columns for Conversations API
-- ============================================================

-- Add Chatwoot columns to social_conversations if missing
ALTER TABLE `social_conversations` ADD COLUMN IF NOT EXISTS `chatwoot_conversation_id` INT NULL;
ALTER TABLE `social_conversations` ADD COLUMN IF NOT EXISTS `chatwoot_inbox_name` VARCHAR(255) NULL;
ALTER TABLE `social_conversations` ADD COLUMN IF NOT EXISTS `assigned_at` DATETIME NULL;
ALTER TABLE `social_conversations` ADD COLUMN IF NOT EXISTS `facebook_page_id` VARCHAR(255) NULL;
ALTER TABLE `social_conversations` ADD COLUMN IF NOT EXISTS `facebook_page_name` VARCHAR(255) NULL;

-- Create conversation_labels table if it doesn't exist
CREATE TABLE IF NOT EXISTS `conversation_labels` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `conversation_id` INT NOT NULL,
  `company_id` INT NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `source` VARCHAR(100) NULL,
  `created_by` VARCHAR(36) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `conversation_labels_conversation_id_idx` (`conversation_id`),
  INDEX `conversation_labels_company_id_idx` (`company_id`),
  CONSTRAINT `conversation_labels_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `social_conversations` (`id`) ON DELETE CASCADE
);

-- Create conversation_releases table if it doesn't exist
CREATE TABLE IF NOT EXISTS `conversation_releases` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `conversation_id` INT NOT NULL,
  `employee_id` INT NOT NULL,
  `company_id` INT NOT NULL,
  `released_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `conversation_releases_conversation_id_idx` (`conversation_id`),
  INDEX `conversation_releases_employee_id_idx` (`employee_id`),
  INDEX `conversation_releases_company_id_idx` (`company_id`),
  CONSTRAINT `conversation_releases_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `social_conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conversation_releases_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conversation_releases_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
);

SELECT 'Conversations API missing tables added successfully!' AS status;
