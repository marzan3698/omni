-- Create reviews table (missing from initial migrations)
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `company_id` INT NULL,
  `author_name` VARCHAR(150) NOT NULL,
  `role` VARCHAR(150) NULL,
  `rating` INT NOT NULL,
  `comment` TEXT NOT NULL,
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `reviews_company_id_idx` (`company_id`),
  CONSTRAINT `reviews_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL
);

-- Create blog_posts table (missing from initial migrations)
CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `company_id` INT NULL,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `excerpt` VARCHAR(500) NULL,
  `content` TEXT NOT NULL,
  `cover_image` VARCHAR(500) NULL,
  `tags` JSON NULL,
  `status` ENUM('Draft', 'Published', 'Archived') NOT NULL DEFAULT 'Published',
  `published_at` DATETIME NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `blog_posts_slug_key` (`slug`),
  INDEX `blog_posts_company_id_idx` (`company_id`),
  INDEX `blog_posts_status_idx` (`status`),
  CONSTRAINT `blog_posts_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL
);
