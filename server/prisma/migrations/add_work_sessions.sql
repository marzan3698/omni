-- Add is_online and last_online_at to users table
ALTER TABLE users ADD COLUMN is_online BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN last_online_at DATETIME NULL;

-- Create work_sessions table
CREATE TABLE IF NOT EXISTS work_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  company_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NULL,
  duration INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_work_sessions_user_id (user_id),
  INDEX idx_work_sessions_company_id (company_id),
  INDEX idx_work_sessions_start_time (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
