-- Add image_url column to social_messages table
ALTER TABLE social_messages
  ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NULL AFTER content,
  ADD INDEX IF NOT EXISTS idx_image_url (image_url);

