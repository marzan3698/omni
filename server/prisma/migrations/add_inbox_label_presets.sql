-- Create table for dynamic inbox labeling presets
CREATE TABLE IF NOT EXISTS `inbox_label_presets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `color` VARCHAR(20),
    `description` TEXT,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `inbox_label_presets_company_id_idx`(`company_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign key constraint
ALTER TABLE `inbox_label_presets`
ADD CONSTRAINT `inbox_label_presets_company_id_fkey` 
FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) 
ON DELETE CASCADE ON UPDATE CASCADE;
