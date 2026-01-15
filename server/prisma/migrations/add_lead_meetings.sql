-- Add LeadMeetingStatus enum if not exists
-- Note: MySQL doesn't support ALTER TYPE, so we'll use ENUM directly in table creation

-- Create lead_meetings table
CREATE TABLE IF NOT EXISTS `lead_meetings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `lead_id` INT NOT NULL,
  `client_id` INT NULL,
  `created_by` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `meeting_time` DATETIME NOT NULL,
  `duration_minutes` INT NOT NULL,
  `google_meet_url` VARCHAR(500) NOT NULL,
  `status` ENUM('Scheduled', 'Completed', 'Canceled') NOT NULL DEFAULT 'Scheduled',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_lead_id` (`lead_id`),
  INDEX `idx_client_id` (`client_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_meeting_time` (`meeting_time`),
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
