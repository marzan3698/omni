-- Migration: Add bio and e_signature fields to users table
-- Date: 2024

USE omni_db;

ALTER TABLE users
ADD COLUMN bio TEXT NULL AFTER profile_image,
ADD COLUMN e_signature TEXT NULL AFTER bio;

