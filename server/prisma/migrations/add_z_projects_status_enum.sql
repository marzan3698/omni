-- Update project status enum to include StartedWorking
-- This runs after add_projects_and_campaign_clients.sql which creates the projects table
ALTER TABLE projects MODIFY COLUMN status ENUM('Draft', 'Submitted', 'StartedWorking', 'InProgress', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Draft';
