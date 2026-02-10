-- Facebook v2: per-company app config, integration display/diagnostics, conversation page badges

CREATE TABLE facebook_app_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL UNIQUE,
  app_id VARCHAR(100) NOT NULL,
  app_secret VARCHAR(255) NOT NULL,
  verify_token VARCHAR(255) NOT NULL,
  redirect_uri_override VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_facebook_app_configs_company_id (company_id),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

ALTER TABLE integrations
  ADD COLUMN display_name VARCHAR(255) NULL AFTER is_webhook_active,
  ADD COLUMN meta_json JSON NULL AFTER display_name,
  ADD COLUMN last_error TEXT NULL AFTER meta_json,
  ADD COLUMN last_validated_at DATETIME NULL AFTER last_error,
  ADD COLUMN last_webhook_at DATETIME NULL AFTER last_validated_at;

ALTER TABLE social_conversations
  ADD COLUMN facebook_page_id VARCHAR(255) NULL AFTER whatsapp_slot_id,
  ADD COLUMN facebook_page_name VARCHAR(255) NULL AFTER facebook_page_id,
  ADD INDEX idx_social_conversations_facebook_page_id (facebook_page_id);
