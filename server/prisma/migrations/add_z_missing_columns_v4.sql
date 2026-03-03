-- ============================================================
-- Fix missing columns in leads table (v4)
-- ============================================================

-- Fix leads table
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `created_by` VARCHAR(36) NOT NULL DEFAULT 'system';

-- Other fields that were added recently to Lead model just in case
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `priority_id` INT NULL;
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `value` DECIMAL(12,2) NULL;
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `conversation_id` INT NULL;
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `customer_name` VARCHAR(255) NULL;
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `phone` VARCHAR(50) NULL;
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `category_id` INT NULL;
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `interest_id` INT NULL;
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `campaign_id` INT NULL;
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `product_id` INT NULL;
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `purchase_price` DECIMAL(12,2) NULL;
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `sale_price` DECIMAL(12,2) NULL;
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `profit` DECIMAL(12,2) NULL;
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `converted_to_client_id` INT NULL;

SELECT 'Missing columns added to leads table successfully!' AS status;
