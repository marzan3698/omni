-- Add converted_to_client_id to leads table (set when lead is converted to client)
ALTER TABLE `leads`
  ADD COLUMN IF NOT EXISTS `converted_to_client_id` INT NULL,
  ADD INDEX IF NOT EXISTS `leads_converted_to_client_id_idx` (`converted_to_client_id`);
