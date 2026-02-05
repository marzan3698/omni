-- Add 'whatsapp' to social_conversations.platform enum (SocialPlatform)
-- MySQL: modify column to include new enum value

ALTER TABLE social_conversations
MODIFY COLUMN platform ENUM('facebook', 'chatwoot', 'whatsapp') NOT NULL;
