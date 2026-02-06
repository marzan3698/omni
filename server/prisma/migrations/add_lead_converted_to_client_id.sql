-- Add converted_to_client_id to leads table (set when lead is converted to client)
ALTER TABLE `leads`
  ADD COLUMN `converted_to_client_id` INT NULL AFTER `profit`,
  ADD INDEX `leads_converted_to_client_id_idx` (`converted_to_client_id`),
  ADD CONSTRAINT `leads_converted_to_client_id_fkey` FOREIGN KEY (`converted_to_client_id`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
