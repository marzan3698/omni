-- Migration: Add Chatwoot webhook fields and update SocialPlatform enum
-- Run this migration to add webhook support for Chatwoot integration

-- 1. Add webhook_mode enum
CREATE TABLE IF NOT EXISTS webhook_mode_temp (
  value ENUM('local', 'live') NOT NULL PRIMARY KEY
);

-- 2. Add webhook fields to integrations table
ALTER TABLE integrations
  ADD COLUMN IF NOT EXISTS webhook_mode ENUM('local', 'live') DEFAULT 'local' AFTER is_active,
  ADD COLUMN IF NOT EXISTS is_webhook_active BOOLEAN DEFAULT FALSE AFTER webhook_mode;

-- 3. Update social_platform enum to include 'chatwoot'
-- Note: MySQL doesn't support ALTER ENUM directly, so we need to recreate the enum
-- This is a workaround for MySQL

-- First, check if chatwoot already exists in the enum
-- If not, we'll need to modify the table structure

-- For MySQL, we need to alter the column type
ALTER TABLE social_conversations
  MODIFY COLUMN platform ENUM('facebook', 'chatwoot') NOT NULL;

-- Clean up temp table
DROP TABLE IF EXISTS webhook_mode_temp;

