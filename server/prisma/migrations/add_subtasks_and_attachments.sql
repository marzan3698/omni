-- Add Sub-tasks, Attachments, Conversations, and Messages for Advanced Task Management
-- This migration adds support for sub-tasks, multimedia attachments, and task conversations

-- Step 1: Add progress and conversation_id to tasks table
ALTER TABLE `tasks`
ADD COLUMN `progress` DECIMAL(5, 2) DEFAULT 0.00 CHECK (`progress` >= 0 AND `progress` <= 100) AFTER `status`,
ADD COLUMN `conversation_id` INT NULL AFTER `progress`;

-- Step 2: Create sub_tasks table
CREATE TABLE IF NOT EXISTS `sub_tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT NOT NULL,
  `company_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `instructions` TEXT NULL,
  `weight` DECIMAL(5, 2) NOT NULL DEFAULT 1.00,
  `status` ENUM('Pending', 'StartedWorking', 'Complete', 'Cancel') NOT NULL DEFAULT 'Pending',
  `order` INT NOT NULL DEFAULT 0,
  `started_at` DATETIME NULL,
  `completed_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_task_id` (`task_id`),
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_order` (`order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 3: Create task_attachments table
CREATE TABLE IF NOT EXISTS `task_attachments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT NULL,
  `sub_task_id` INT NULL,
  `company_id` INT NOT NULL,
  `file_type` ENUM('image', 'pdf', 'video', 'audio', 'link') NOT NULL,
  `file_url` VARCHAR(500) NULL,
  `file_name` VARCHAR(255) NULL,
  `file_size` BIGINT NULL,
  `mime_type` VARCHAR(100) NULL,
  `link_url` VARCHAR(1000) NULL,
  `link_title` VARCHAR(255) NULL,
  `link_description` TEXT NULL,
  `thumbnail_url` VARCHAR(500) NULL,
  `duration` INT NULL COMMENT 'Duration in seconds for audio/video',
  `created_by` VARCHAR(36) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_task_id` (`task_id`),
  INDEX `idx_sub_task_id` (`sub_task_id`),
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_file_type` (`file_type`),
  INDEX `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 4: Create task_conversations table
CREATE TABLE IF NOT EXISTS `task_conversations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT NOT NULL UNIQUE,
  `company_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_task_id` (`task_id`),
  INDEX `idx_company_id` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 5: Create task_messages table
CREATE TABLE IF NOT EXISTS `task_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `conversation_id` INT NOT NULL,
  `sender_id` VARCHAR(36) NOT NULL,
  `content` TEXT NULL,
  `message_type` ENUM('text', 'image', 'file', 'audio', 'system') NOT NULL DEFAULT 'text',
  `attachment_id` INT NULL,
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `read_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_conversation_id` (`conversation_id`),
  INDEX `idx_sender_id` (`sender_id`),
  INDEX `idx_attachment_id` (`attachment_id`),
  INDEX `idx_is_read` (`is_read`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 6: Update existing tasks to have progress = 0
UPDATE `tasks` SET `progress` = 0.00 WHERE `progress` IS NULL;
