-- ============================================================
-- Fix missing columns in social_messages and lead_meetings
-- ============================================================

-- Fix social_messages table
ALTER TABLE `social_messages` ADD COLUMN IF NOT EXISTS `is_seen` TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE `social_messages` ADD COLUMN IF NOT EXISTS `seen_at` DATETIME NULL;
ALTER TABLE `social_messages` ADD COLUMN IF NOT EXISTS `external_message_id` VARCHAR(255) NULL;

-- Fix lead_meetings table
ALTER TABLE `lead_meetings` ADD COLUMN IF NOT EXISTS `client_id` INT NULL;
ALTER TABLE `lead_meetings` ADD COLUMN IF NOT EXISTS `description` TEXT NULL;
ALTER TABLE `lead_meetings` ADD COLUMN IF NOT EXISTS `platform` VARCHAR(50) NOT NULL DEFAULT 'Google meet';
ALTER TABLE `lead_meetings` ADD COLUMN IF NOT EXISTS `google_meet_url` VARCHAR(500) NULL;
ALTER TABLE `lead_meetings` ADD COLUMN IF NOT EXISTS `duration_minutes` INT NOT NULL DEFAULT 30;

SELECT 'Missing columns added to social_messages and lead_meetings successfully!' AS status;
