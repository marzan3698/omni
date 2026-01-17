-- Add product pricing fields to leads table
ALTER TABLE `leads` 
ADD COLUMN `product_id` INT NULL AFTER `campaign_id`,
ADD COLUMN `purchase_price` DECIMAL(12, 2) NULL AFTER `product_id`,
ADD COLUMN `sale_price` DECIMAL(12, 2) NULL AFTER `purchase_price`,
ADD COLUMN `profit` DECIMAL(12, 2) NULL AFTER `sale_price`;

-- Add index for product_id
ALTER TABLE `leads`
ADD INDEX `idx_product_id` (`product_id`);

-- Add foreign key constraint for product_id
ALTER TABLE `leads`
ADD CONSTRAINT `fk_leads_product` 
FOREIGN KEY (`product_id`) 
REFERENCES `products`(`id`) 
ON DELETE SET NULL;

