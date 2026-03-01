-- ============================================================
-- Comprehensive fix: Add all missing columns to server DB
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ============================================================

-- Fix users table: profile_image and e_signature as TEXT
ALTER TABLE `users` MODIFY COLUMN `profile_image` TEXT;
ALTER TABLE `users` MODIFY COLUMN `e_signature` TEXT;

-- Fix employees table: missing columns
ALTER TABLE `employees` ADD COLUMN IF NOT EXISTS `work_hours` DECIMAL(5,2) NULL;
ALTER TABLE `employees` ADD COLUMN IF NOT EXISTS `holidays` INT NULL;
ALTER TABLE `employees` ADD COLUMN IF NOT EXISTS `bonus` DECIMAL(10,2) NULL;
ALTER TABLE `employees` ADD COLUMN IF NOT EXISTS `responsibilities` TEXT NULL;
ALTER TABLE `employees` ADD COLUMN IF NOT EXISTS `department_id` INT NULL;
ALTER TABLE `employees` ADD COLUMN IF NOT EXISTS `reserve_balance` DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE `employees` ADD COLUMN IF NOT EXISTS `main_balance` DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE `employees` ADD COLUMN IF NOT EXISTS `reserve_points` DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE `employees` ADD COLUMN IF NOT EXISTS `main_points` DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Fix users table: missing columns often added later
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `name` VARCHAR(150) NULL;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `phone` VARCHAR(50) NULL;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `address` TEXT NULL;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `education` VARCHAR(255) NULL;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `is_online` TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `last_seen` DATETIME NULL;

-- Fix companies table: missing columns
ALTER TABLE `companies` ADD COLUMN IF NOT EXISTS `phone` VARCHAR(50) NULL;
ALTER TABLE `companies` ADD COLUMN IF NOT EXISTS `website` VARCHAR(255) NULL;
ALTER TABLE `companies` ADD COLUMN IF NOT EXISTS `address` TEXT NULL;
ALTER TABLE `companies` ADD COLUMN IF NOT EXISTS `industry` VARCHAR(100) NULL;
ALTER TABLE `companies` ADD COLUMN IF NOT EXISTS `logo` VARCHAR(500) NULL;
ALTER TABLE `companies` ADD COLUMN IF NOT EXISTS `description` TEXT NULL;
ALTER TABLE `companies` ADD COLUMN IF NOT EXISTS `client_role_id` INT NULL;
ALTER TABLE `companies` ADD COLUMN IF NOT EXISTS `timezone` VARCHAR(100) NULL DEFAULT 'UTC';

-- Fix leads table
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `description` TEXT NULL;
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `source` VARCHAR(100) NULL;
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `contact_info` JSON NULL;
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `label_id` INT NULL;

-- Fix tasks table
ALTER TABLE `tasks` ADD COLUMN IF NOT EXISTS `priority` ENUM('Low','Medium','High','Urgent') NULL DEFAULT 'Medium';
ALTER TABLE `tasks` ADD COLUMN IF NOT EXISTS `estimated_hours` DECIMAL(8,2) NULL;
ALTER TABLE `tasks` ADD COLUMN IF NOT EXISTS `actual_hours` DECIMAL(8,2) NULL;

-- Fix social_conversations table
ALTER TABLE `social_conversations` ADD COLUMN IF NOT EXISTS `whatsapp_slot_id` VARCHAR(10) NULL;
ALTER TABLE `social_conversations` ADD COLUMN IF NOT EXISTS `assigned_to` INT NULL;

SELECT 'All missing columns added successfully!' AS status;
