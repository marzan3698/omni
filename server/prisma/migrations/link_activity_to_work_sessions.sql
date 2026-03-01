-- Add session_id FK to activity_logs and screen_captures
-- Must run AFTER add_work_sessions.sql (work_sessions table must exist)

ALTER TABLE activity_logs
  ADD CONSTRAINT fk_activity_logs_session
  FOREIGN KEY (session_id) REFERENCES work_sessions(id) ON DELETE SET NULL;

ALTER TABLE screen_captures
  ADD CONSTRAINT fk_screen_captures_session
  FOREIGN KEY (session_id) REFERENCES work_sessions(id) ON DELETE SET NULL;
