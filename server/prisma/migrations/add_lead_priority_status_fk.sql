ALTER TABLE `leads`
  ADD INDEX IF NOT EXISTS `idx_priority_id` (`priority_id`),
  ADD INDEX IF NOT EXISTS `idx_status_id` (`status_id`);
