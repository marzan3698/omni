-- Facebook v2: per-company app config, integration display/diagnostics, conversation page badges

CREATE TABLE IF NOT EXISTS facebook_app_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL UNIQUE,
  app_id VARCHAR(100) NOT NULL,
  app_secret VARCHAR(255) NOT NULL,
  verify_token VARCHAR(255) NOT NULL,
  redirect_uri_override VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_facebook_app_configs_company_id (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE integrations
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS meta_json JSON NULL,
  ADD COLUMN IF NOT EXISTS last_error TEXT NULL,
  ADD COLUMN IF NOT EXISTS last_validated_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS last_webhook_at DATETIME NULL;

ALTER TABLE social_conversations
  ADD COLUMN IF NOT EXISTS facebook_page_id VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS facebook_page_name VARCHAR(255) NULL,
  ADD INDEX IF NOT EXISTS idx_social_conversations_facebook_page_id (facebook_page_id);
