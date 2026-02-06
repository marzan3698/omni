-- Remove Chatwoot integration: delete data and update enums to facebook/whatsapp only.

-- Delete chatwoot conversations and related data (messages are cascade-deleted by FK)
DELETE FROM social_conversations WHERE platform = 'chatwoot';

-- Delete chatwoot integrations
DELETE FROM integrations WHERE provider = 'chatwoot';

-- Update social_conversations.platform enum (MySQL)
ALTER TABLE social_conversations
MODIFY COLUMN platform ENUM('facebook', 'whatsapp') NOT NULL;

-- Update integrations.provider enum (MySQL)
ALTER TABLE integrations
MODIFY COLUMN provider ENUM('facebook', 'whatsapp') NOT NULL;
