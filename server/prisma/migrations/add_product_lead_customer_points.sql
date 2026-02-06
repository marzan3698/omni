-- Add lead_point and customer_point to products table (optional decimal fields)
ALTER TABLE `products`
  ADD COLUMN `lead_point` DECIMAL(10, 2) NULL AFTER `quick_replies`,
  ADD COLUMN `customer_point` DECIMAL(10, 2) NULL AFTER `lead_point`;
