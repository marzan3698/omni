-- Migration: Update users table - replace bio with separate fields
-- Date: 2024

USE omni_db;

-- Add new fields
ALTER TABLE users
ADD COLUMN name VARCHAR(255) NULL AFTER id,
ADD COLUMN phone VARCHAR(50) NULL AFTER email,
ADD COLUMN address TEXT NULL AFTER password_hash,
ADD COLUMN education TEXT NULL AFTER address;

-- Remove bio field if it exists (uncomment if bio column exists)
-- ALTER TABLE users DROP COLUMN bio;

