-- Add project_id and group_id columns to tasks table for advanced task assignment
ALTER TABLE `tasks`
ADD COLUMN `project_id` INT NULL AFTER `due_date`,
ADD COLUMN `group_id` INT NULL AFTER `assigned_to`;

-- Add indexes for performance
ALTER TABLE `tasks`
ADD INDEX `idx_project_id` (`project_id`),
ADD INDEX `idx_group_id` (`group_id`);

-- Add foreign key constraint for project_id
ALTER TABLE `tasks`
ADD CONSTRAINT `fk_tasks_project`
FOREIGN KEY (`project_id`)
REFERENCES `projects`(`id`)
ON DELETE SET NULL;

-- Add foreign key constraint for group_id
ALTER TABLE `tasks`
ADD CONSTRAINT `fk_tasks_group`
FOREIGN KEY (`group_id`)
REFERENCES `employee_groups`(`id`)
ON DELETE SET NULL;

