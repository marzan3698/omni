# cPanel Quick Fix Guide (বাংলা) - দ্রুত সমাধান

## 🚀 দ্রুত সমাধান (2 মিনিটে)

### Step 1: Conversation Labels Table তৈরি করুন

1. **cPanel → phpMyAdmin** খুলুন
2. আপনার database select করুন
3. **SQL** tab-এ click করুন
4. এই SQL copy-paste করুন:

```sql
CREATE TABLE IF NOT EXISTS `conversation_labels` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `conversation_id` INT NOT NULL,
  `company_id` INT NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `source` VARCHAR(100) NULL,
  `created_by` VARCHAR(36) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_conversation_id` (`conversation_id`),
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_name` (`name`),
  FOREIGN KEY (`conversation_id`) REFERENCES `social_conversations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

5. **Go** button click করুন

### Step 2: Chatwoot Conversations Fix করুন

**phpMyAdmin SQL tab-এ এই query run করুন:**

```sql
-- প্রথমে superadmin-এর company_id check করুন
SELECT u.company_id FROM users u WHERE u.email = 'superadmin@omni.com';

-- তারপর Chatwoot conversations update করুন (1 replace করুন আপনার actual company_id দিয়ে)
UPDATE social_conversations 
SET company_id = 1 
WHERE platform = 'chatwoot' 
AND company_id != 1;

-- Integration update করুন
UPDATE integrations 
SET company_id = 1 
WHERE provider = 'chatwoot' 
AND company_id != 1;
```

### Step 3: Node.js App Restart করুন

1. **cPanel → Node.js Selector**
2. আপনার app-এ **Restart** button click করুন

### Step 4: Test করুন

1. Application-এ login করুন
2. **Inbox** page-এ যান
3. Chatwoot conversations দেখা যাচ্ছে কিনা check করুন

---

## ✅ Done!

এখন সবকিছু কাজ করবে!

**বিস্তারিত guide:** `docs/CPANEL_FIX_STEPS_BANGLA.md`
