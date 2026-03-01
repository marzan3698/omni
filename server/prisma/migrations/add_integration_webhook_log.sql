-- Integration Webhook Log - for error history and monitoring
-- Idempotent: can run multiple times
-- Use: node scripts/migrate-simple.cjs add_integration_webhook_log.sql (if available)

CREATE TABLE IF NOT EXISTS `integration_webhook_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `integration_id` INT NOT NULL,
  `success` TINYINT(1) NOT NULL,
  `error_message` TEXT NULL,
  `payload_snippet` VARCHAR(500) NULL,
  `source` VARCHAR(50) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_integration_id` (`integration_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
