-- Add balance and points fields to employees table
-- Reserve Balance: পয়েন্ট/ব্যালেন্স যা এখনো মেইনে ট্রান্সফার হয়নি
-- Main Balance/Points: চূড়ান্ত অর্জিত পয়েন্ট/ব্যালেন্স

ALTER TABLE `employees`
  ADD COLUMN `reserve_balance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER `join_date`,
  ADD COLUMN `main_balance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER `reserve_balance`,
  ADD COLUMN `reserve_points` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER `main_balance`,
  ADD COLUMN `main_points` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER `reserve_points`;
