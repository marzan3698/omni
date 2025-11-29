-- Add Chatwoot integration columns to integrations table
-- Run this SQL manually if columns don't exist

ALTER TABLE integrations 
  ADD COLUMN IF NOT EXISTS account_id VARCHAR(255) NULL AFTER access_token,
  ADD COLUMN IF NOT EXISTS base_url VARCHAR(500) NULL AFTER account_id;

ALTER TABLE integrations 
  MODIFY COLUMN provider ENUM('facebook', 'whatsapp', 'chatwoot') NOT NULL;

