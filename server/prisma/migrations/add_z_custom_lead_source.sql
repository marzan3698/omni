-- ============================================================
-- Add 'Custom' to the lead_source enum in MariaDB
-- ============================================================

-- Check if Custom already exists before altering
SET @col_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'leads' 
    AND COLUMN_NAME = 'source'
    AND COLUMN_TYPE LIKE '%Custom%'
);

-- Only alter if Custom is NOT already in the enum
ALTER TABLE `leads` MODIFY COLUMN `source` ENUM(
  'Website',
  'Referral', 
  'SocialMedia',
  'Email',
  'Phone',
  'Inbox',
  'FacebookPixel',
  'Excel',
  'Other',
  'Custom'
) NOT NULL DEFAULT 'Website';

SELECT 'Custom source added to leads table successfully!' AS status;
