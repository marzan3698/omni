-- Add whatsapp_slot_id to social_conversations for multi-WhatsApp slots (1-5)
ALTER TABLE social_conversations
ADD COLUMN whatsapp_slot_id VARCHAR(10) DEFAULT NULL;

CREATE INDEX idx_social_conversations_whatsapp_slot
ON social_conversations(whatsapp_slot_id);
