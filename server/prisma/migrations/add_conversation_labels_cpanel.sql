-- ============================================
-- Conversation Labels Migration for cPanel
-- ============================================
-- This migration creates the conversation_labels table
-- Run this in cPanel phpMyAdmin SQL tab
-- ============================================

-- Create conversation_labels table
CREATE TABLE IF NOT EXISTS `conversation_labels` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `conversation_id` INT NOT NULL,
  `company_id` INT NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `source` VARCHAR(100) NULL,
  `created_by` VARCHAR(36) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_conversation_id` (`conversation_id`),
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_name` (`name`),
  FOREIGN KEY (`conversation_id`) REFERENCES `social_conversations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verification query (run after migration)
-- SELECT * FROM conversation_labels LIMIT 1;
