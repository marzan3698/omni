# cPanel Fix - সম্পূর্ণ সমাধান (বাংলা)

## 📋 সমস্যা

1. ✅ **Conversation Labels Table নেই** - cPanel database-এ `conversation_labels` table তৈরি হয়নি
2. ✅ **Chatwoot Messages দেখা যাচ্ছে না** - লাইভ সার্ভারে ইনবক্সে Chatwoot conversations দেখা যাচ্ছে না

## 🔧 সমাধান

### Fix 1: Conversation Labels Table তৈরি করুন

**phpMyAdmin-এ এই SQL run করুন:**

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

### Fix 2: Chatwoot Conversations Company ID Fix করুন

**Step 1: SuperAdmin-এর Company ID Check করুন**
```sql
SELECT u.company_id FROM users u WHERE u.email = 'superadmin@omni.com';
```

**Step 2: Chatwoot Conversations Update করুন**
```sql
-- Replace 1 with your actual company_id from Step 1
UPDATE social_conversations 
SET company_id = 1 
WHERE platform = 'chatwoot' 
AND company_id != 1;
```

**Step 3: Integration Update করুন**
```sql
-- Replace 1 with your actual company_id
UPDATE integrations 
SET company_id = 1 
WHERE provider = 'chatwoot' 
AND company_id != 1;
```

### Fix 3: Node.js App Restart করুন

1. cPanel → **Node.js Selector**
2. আপনার app-এ **Restart** button click করুন

## ✅ Verification

1. ✅ `conversation_labels` table তৈরি হয়েছে
2. ✅ Chatwoot conversations-এর `company_id` correct
3. ✅ Inbox-এ Chatwoot conversations দেখা যাচ্ছে
4. ✅ Messages properly load হচ্ছে

## 📚 বিস্তারিত গাইড

সম্পূর্ণ step-by-step guide দেখতে:
- `docs/CPANEL_FIX_STEPS_BANGLA.md`
- `docs/CPANEL_CONVERSATION_LABELS_MIGRATION_BANGLA.md`
- `docs/CPANEL_CHATWOOT_FIX_BANGLA.md`
