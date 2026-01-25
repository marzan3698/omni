# cPanel Fix - Step by Step Guide (বাংলা)

## 🎯 সমস্যা দুটি

1. **Conversation Labels Table নেই** - cPanel database-এ `conversation_labels` table তৈরি হয়নি
2. **Chatwoot Messages দেখা যাচ্ছে না** - লাইভ সার্ভারে ইনবক্সে Chatwoot conversations দেখা যাচ্ছে না

---

## ✅ Part 1: Conversation Labels Table তৈরি করা

### Step 1: phpMyAdmin-এ Login করুন

1. cPanel-এ login করুন
2. **phpMyAdmin** icon-এ click করুন
3. আপনার database select করুন (যেমন: `paaera_database_omni`)

### Step 2: SQL Query Run করুন

1. phpMyAdmin-এর top menu-তে **SQL** tab-এ click করুন
2. এই SQL query টি copy করুন:

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

3. Query paste করুন এবং **Go** button click করুন

### Step 3: Verification

1. Left sidebar-এ `conversation_labels` table দেখা যাবে
2. Table-এ click করুন
3. Structure verify করুন:
   - ✅ 8টি columns আছে
   - ✅ 3টি indexes আছে
   - ✅ Foreign keys set আছে

---

## ✅ Part 2: Chatwoot Messages সমস্যা Fix করা

### Step 1: Database-এ Check করুন

phpMyAdmin-এ এই query run করুন:

```sql
-- Check Chatwoot conversations এবং তাদের company_id
SELECT 
  id, 
  platform, 
  external_user_name, 
  company_id, 
  assigned_to, 
  status,
  (SELECT COUNT(*) FROM social_messages WHERE conversation_id = social_conversations.id) as message_count
FROM social_conversations 
WHERE platform = 'chatwoot' 
ORDER BY last_message_at DESC 
LIMIT 20;
```

**Note করুন:**
- Chatwoot conversations আছে কিনা
- `company_id` কি value আছে
- Messages আছে কিনা

### Step 2: SuperAdmin-এর Company ID Check করুন

```sql
SELECT u.id, u.email, u.company_id, c.name as company_name 
FROM users u 
JOIN companies c ON u.company_id = c.id 
WHERE u.email = 'superadmin@omni.com';
```

**Note করুন:** SuperAdmin-এর `company_id` (সাধারণত `1`)

### Step 3: Company ID Fix করুন

যদি Chatwoot conversations-এর `company_id` superadmin-এর `company_id` সাথে match না করে:

#### A. Conversations-এর Company ID Update করুন

```sql
-- প্রথমে check করুন
SELECT id, external_user_name, company_id 
FROM social_conversations 
WHERE platform = 'chatwoot' 
AND company_id != 1;  -- 1 = superadmin-এর company_id

-- যদি ঠিক মনে হয়, update করুন
UPDATE social_conversations 
SET company_id = 1 
WHERE platform = 'chatwoot' 
AND company_id != 1;
```

#### B. Integration-এর Company ID Check করুন

```sql
-- Check করুন
SELECT id, company_id, account_id, is_active 
FROM integrations 
WHERE provider = 'chatwoot';

-- যদি wrong হয়, update করুন
UPDATE integrations 
SET company_id = 1 
WHERE provider = 'chatwoot' 
AND company_id != 1;
```

### Step 4: Node.js App Restart করুন

1. cPanel → **Node.js Selector**
2. আপনার app select করুন
3. **Restart** button click করুন
4. Logs check করুন errors আছে কিনা

### Step 5: Test করুন

1. Application-এ login করুন (superadmin হিসেবে)
2. **Inbox** page-এ যান
3. **Inbox** tab check করুন (unassigned conversations)
4. **Taken** tab check করুন (assigned conversations)
5. একটি Chatwoot conversation select করুন
6. Messages load হচ্ছে কিনা check করুন

---

## 🔍 Troubleshooting

### Problem: Table Creation Error

**Error:** `Table already exists`
- ✅ **Solution:** এই error ignore করতে পারেন। Table already আছে মানে successful।

**Error:** `Foreign key constraint fails`
- ✅ **Solution:** 
  - `social_conversations` table exists আছে কিনা check করুন
  - `companies` table exists আছে কিনা check করুন

### Problem: Chatwoot Conversations Still Not Showing

**Check করুন:**
1. Browser console-এ errors আছে কিনা (F12 → Console)
2. Network tab-এ API response check করুন
3. Server logs check করুন

**Solution:**
```sql
-- Force update all Chatwoot conversations
UPDATE social_conversations 
SET company_id = 1 
WHERE platform = 'chatwoot';
```

### Problem: Messages Not Loading

**Check করুন:**
```sql
-- Messages আছে কিনা
SELECT COUNT(*) FROM social_messages 
WHERE conversation_id IN (
  SELECT id FROM social_conversations WHERE platform = 'chatwoot'
);
```

---

## 📋 Complete Checklist

### Conversation Labels:
- [ ] phpMyAdmin-এ SQL query run করা হয়েছে
- [ ] `conversation_labels` table তৈরি হয়েছে
- [ ] Table structure verify করা হয়েছে

### Chatwoot Messages:
- [ ] Chatwoot conversations-এর `company_id` check করা হয়েছে
- [ ] Company ID update করা হয়েছে (যদি প্রয়োজন হয়)
- [ ] Integration-এর `company_id` correct আছে
- [ ] Node.js app restart করা হয়েছে
- [ ] Inbox-এ Chatwoot conversations দেখা যাচ্ছে
- [ ] Messages properly load হচ্ছে

---

## 🚀 Quick Fix Commands

### All-in-One SQL Fix:

```sql
-- 1. Create conversation_labels table
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

-- 2. Fix Chatwoot conversations company_id (replace 1 with your actual company_id)
UPDATE social_conversations 
SET company_id = 1 
WHERE platform = 'chatwoot' 
AND company_id != 1;

-- 3. Fix Chatwoot integration company_id (replace 1 with your actual company_id)
UPDATE integrations 
SET company_id = 1 
WHERE provider = 'chatwoot' 
AND company_id != 1;
```

---

## ⚠️ Important Notes

1. **Backup:** কোনো database change করার আগে backup নিন
2. **Company ID:** SuperAdmin-এর `company_id` verify করুন before update
3. **Testing:** Change করার পর application test করুন
4. **Logs:** Server logs regularly check করুন

---

## 📞 Support

যদি সমস্যা persists করে:
1. Server logs share করুন
2. Database query results share করুন  
3. Browser console errors share করুন

---

**Last Updated:** 2026-01-25
