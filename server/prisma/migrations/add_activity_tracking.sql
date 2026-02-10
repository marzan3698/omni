-- Activity tracking: activity_logs and screen_captures tables

CREATE TABLE activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  company_id INT NOT NULL,
  session_id INT NULL,
  mouse_clicks INT NOT NULL DEFAULT 0,
  mouse_movements INT NOT NULL DEFAULT 0,
  keystrokes INT NOT NULL DEFAULT 0,
  activity_score INT NOT NULL DEFAULT 0,
  interval_start DATETIME NOT NULL,
  interval_end DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_activity_logs_user_id (user_id),
  INDEX idx_activity_logs_company_id (company_id),
  INDEX idx_activity_logs_session_id (session_id),
  INDEX idx_activity_logs_interval_start (interval_start),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES work_sessions(id) ON DELETE SET NULL
);

CREATE TABLE screen_captures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  company_id INT NOT NULL,
  session_id INT NULL,
  image_url VARCHAR(500) NOT NULL,
  page_url VARCHAR(500) NULL,
  captured_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_screen_captures_user_id (user_id),
  INDEX idx_screen_captures_company_id (company_id),
  INDEX idx_screen_captures_session_id (session_id),
  INDEX idx_screen_captures_captured_at (captured_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES work_sessions(id) ON DELETE SET NULL
);
