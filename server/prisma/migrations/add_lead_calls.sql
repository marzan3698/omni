-- Create lead_call_status enum
CREATE TABLE IF NOT EXISTS `lead_call_status_temp` (
  `status` ENUM('Scheduled', 'Completed', 'Canceled', 'NoAnswer', 'Busy', 'LeftVoicemail') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create lead_calls table
CREATE TABLE IF NOT EXISTS `lead_calls` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `lead_id` INT NOT NULL,
  `client_id` INT NULL,
  `assigned_to` INT NOT NULL,
  `created_by` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NULL,
  `phone_number` VARCHAR(50) NULL,
  `call_time` DATETIME NOT NULL,
  `duration_minutes` INT NULL,
  `status` ENUM('Scheduled', 'Completed', 'Canceled', 'NoAnswer', 'Busy', 'LeftVoicemail') NOT NULL DEFAULT 'Scheduled',
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_lead_id` (`lead_id`),
  INDEX `idx_client_id` (`client_id`),
  INDEX `idx_assigned_to` (`assigned_to`),
  INDEX `idx_status` (`status`),
  INDEX `idx_call_time` (`call_time`),
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`assigned_to`) REFERENCES `employees`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Drop temporary table
DROP TABLE IF EXISTS `lead_call_status_temp`;
