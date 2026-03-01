-- Add project_id and group_id columns to tasks table for advanced task assignment
ALTER TABLE `tasks`
ADD COLUMN `project_id` INT NULL AFTER `due_date`,
ADD COLUMN `group_id` INT NULL AFTER `assigned_to`;

-- Add indexes for performance
ALTER TABLE `tasks`
ADD INDEX `idx_project_id` (`project_id`),
ADD INDEX `idx_group_id` (`group_id`);

-- FK omitted (errno 150 on MariaDB)

