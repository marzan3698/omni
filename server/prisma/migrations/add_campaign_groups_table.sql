-- Create campaign_groups table for linking campaigns to employee groups
CREATE TABLE IF NOT EXISTS `campaign_groups` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` INT NOT NULL,
  `group_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_campaign_group` (`campaign_id`, `group_id`),
  INDEX `idx_campaign_id` (`campaign_id`),
  INDEX `idx_group_id` (`group_id`),
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`group_id`) REFERENCES `employee_groups`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

