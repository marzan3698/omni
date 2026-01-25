# cPanel-এ Conversation Labels এবং Chatwoot Messages Fix - সম্পূর্ণ গাইড (বাংলা)

## সমস্যা দুটি

1. **Conversation Labels**: লোকাল ডাটাবেজে `conversation_labels` table আছে কিন্তু cPanel-এ নেই
2. **Chatwoot Messages**: লাইভ সার্ভারে নতুন code push করার পর ইনবক্সে Chatwoot messages দেখা যাচ্ছে না

---

## Part 1: Conversation Labels Table তৈরি করা

### Method 1: phpMyAdmin ব্যবহার করে (সবচেয়ে সহজ) ⭐

#### Step 1: phpMyAdmin-এ Login করুন
1. cPanel-এ login করুন
2. **phpMyAdmin** icon-এ click করুন
3. আপনার database select করুন (যেমন: `paaera_database_omni`)

#### Step 2: SQL Query Run করুন
1. phpMyAdmin-এর top menu-তে **SQL** tab-এ click করুন
2. এই SQL query টি copy করে paste করুন:

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

3. **Go** button click করুন

#### Step 3: Verification
1. Left sidebar-এ `conversation_labels` table দেখা যাবে
2. Table-এ click করে structure verify করুন
3. 8টি columns এবং 3টি indexes আছে কিনা check করুন

---

## Part 2: Chatwoot Messages সমস্যা সমাধান

### Step 1: Database-এ Chatwoot Conversations Check করুন

#### phpMyAdmin-এ এই Query Run করুন:

```sql
-- Check Chatwoot conversations
SELECT 
  id, 
  platform, 
  external_user_id, 
  external_user_name, 
  company_id, 
  assigned_to, 
  status, 
  last_message_at,
  (SELECT COUNT(*) FROM social_messages WHERE conversation_id = social_conversations.id) as message_count
FROM social_conversations 
WHERE platform = 'chatwoot' 
ORDER BY last_message_at DESC 
LIMIT 20;
```

**Check করুন:**
- ✅ Chatwoot conversations আছে কিনা
- ✅ `company_id` কি value আছে
- ✅ Messages আছে কিনা (`message_count > 0`)

### Step 2: SuperAdmin-এর Company ID Check করুন

```sql
SELECT u.id, u.email, u.company_id, c.name as company_name 
FROM users u 
JOIN companies c ON u.company_id = c.id 
WHERE u.email = 'superadmin@omni.com';
```

**Note করুন:** SuperAdmin-এর `company_id` কি (সাধারণত `1`)

### Step 3: Company ID Mismatch Fix করুন

যদি Chatwoot conversations-এর `company_id` superadmin-এর `company_id` সাথে match না করে:

#### Option A: Conversations-এর Company ID Update করুন

**⚠️ সাবধান:** শুধুমাত্র যদি আপনি নিশ্চিত হন যে এই conversations সঠিক company-এর।

```sql
-- প্রথমে check করুন কোন conversations update হবে
SELECT id, external_user_name, company_id 
FROM social_conversations 
WHERE platform = 'chatwoot' 
AND company_id != 1;  -- 1 = আপনার superadmin-এর company_id

-- যদি ঠিক মনে হয়, তাহলে update করুন
UPDATE social_conversations 
SET company_id = 1  -- আপনার superadmin-এর company_id
WHERE platform = 'chatwoot' 
AND company_id != 1;
```

#### Option B: Integration-এর Company ID Check করুন

```sql
-- Integration check করুন
SELECT id, company_id, account_id, page_id, is_active 
FROM integrations 
WHERE provider = 'chatwoot';

-- যদি company_id wrong হয়, update করুন
UPDATE integrations 
SET company_id = 1  -- আপনার correct company_id
WHERE provider = 'chatwoot' 
AND company_id != 1;
```

### Step 4: Chatwoot Conversations Sync করুন

#### Method 1: API Endpoint ব্যবহার করে

1. Application-এ login করুন (superadmin হিসেবে)
2. Browser-এ এই URL visit করুন:
   ```
   https://yourdomain.com/api/chatwoot/sync
   ```
   অথবা Postman/cURL ব্যবহার করুন:
   ```bash
   curl -X POST https://yourdomain.com/api/chatwoot/sync \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

#### Method 2: Manual Sync (যদি API কাজ না করে)

1. cPanel → **Node.js Selector**
2. আপনার app-এ **Restart** button click করুন
3. Logs check করুন errors আছে কিনা

### Step 5: Verification

#### Database-এ Check করুন:

```sql
-- Check unassigned Chatwoot conversations (should show in inbox)
SELECT id, external_user_name, company_id, assigned_to 
FROM social_conversations 
WHERE platform = 'chatwoot' 
AND company_id = 1  -- আপনার company_id
AND assigned_to IS NULL;

-- Check assigned Chatwoot conversations (should show in taken tab)
SELECT id, external_user_name, company_id, assigned_to 
FROM social_conversations 
WHERE platform = 'chatwoot' 
AND company_id = 1  -- আপনার company_id
AND assigned_to IS NOT NULL;
```

#### Application-এ Test করুন:

1. Application-এ login করুন
2. **Inbox** page-এ যান
3. **Inbox** tab-এ unassigned Chatwoot conversations দেখা যাবে
4. **Taken** tab-এ assigned Chatwoot conversations দেখা যাবে
5. একটি conversation select করুন
6. Messages properly load হচ্ছে কিনা check করুন

---

## Part 3: Code Fixes Applied

আমি code-এ এই fixes apply করেছি:

1. ✅ Chatwoot sync service-এ `companyId` filter যোগ করা হয়েছে
2. ✅ Webhook handler-এ `companyId` update ensure করা হয়েছে
3. ✅ Query-তে proper `companyId` filtering যোগ করা হয়েছে
4. ✅ Debug logging যোগ করা হয়েছে

---

## Complete Checklist

### Conversation Labels:
- [ ] phpMyAdmin-এ `conversation_labels` table তৈরি করা হয়েছে
- [ ] Table structure verify করা হয়েছে (8 columns, 3 indexes)
- [ ] Foreign keys properly set আছে

### Chatwoot Messages:
- [ ] Chatwoot conversations-এর `company_id` correct আছে
- [ ] Integration-এর `company_id` correct আছে
- [ ] Inbox tab-এ unassigned Chatwoot conversations দেখা যাচ্ছে
- [ ] Taken tab-এ assigned Chatwoot conversations দেখা যাচ্ছে
- [ ] Messages properly load হচ্ছে
- [ ] Labels add/edit/delete কাজ করছে

### Server:
- [ ] Node.js app restart করা হয়েছে
- [ ] Prisma client regenerate করা হয়েছে (যদি server-এ access থাকে)
- [ ] Server logs check করা হয়েছে (errors নেই)

---

## Troubleshooting

### Problem 1: Table Creation Failed

**Error:** `Table 'conversation_labels' already exists`
**Solution:** এই error ignore করতে পারেন। Table already আছে মানে migration successful।

**Error:** `Foreign key constraint fails`
**Solution:** 
- Verify করুন `social_conversations` table exists
- Verify করুন `companies` table exists

### Problem 2: Chatwoot Conversations Still Not Showing

**Check করুন:**
1. Browser console-এ errors আছে কিনা
2. Network tab-এ API response check করুন
3. Server logs check করুন
4. Database-এ conversations আছে কিনা verify করুন

**Solution:**
```sql
-- Force update all Chatwoot conversations to correct company_id
UPDATE social_conversations 
SET company_id = 1  -- আপনার correct company_id
WHERE platform = 'chatwoot';
```

### Problem 3: Messages Not Loading

**Check করুন:**
1. Messages table-এ data আছে কিনা:
   ```sql
   SELECT COUNT(*) FROM social_messages 
   WHERE conversation_id IN (
     SELECT id FROM social_conversations WHERE platform = 'chatwoot'
   );
   ```

2. API endpoint test করুন:
   ```
   https://yourdomain.com/api/conversations?tab=inbox
   ```

---

## Important Notes

1. **Backup:** কোনো database change করার আগে backup নিন
2. **Testing:** Production-এ change করার আগে test করুন
3. **Company ID:** সবসময় verify করুন `company_id` correct আছে
4. **Logs:** Server logs regularly check করুন

---

## Quick Reference SQL Queries

### Check Conversations:
```sql
SELECT id, platform, external_user_name, company_id, assigned_to 
FROM social_conversations 
WHERE platform = 'chatwoot';
```

### Check Messages:
```sql
SELECT c.id, c.external_user_name, COUNT(m.id) as msg_count
FROM social_conversations c
LEFT JOIN social_messages m ON c.id = m.conversation_id
WHERE c.platform = 'chatwoot'
GROUP BY c.id;
```

### Fix Company ID:
```sql
UPDATE social_conversations 
SET company_id = 1 
WHERE platform = 'chatwoot' 
AND company_id != 1;
```

---

## Support

যদি সমস্যা persists করে:
1. Server logs share করুন
2. Database query results share করুন
3. Browser console errors share করুন

---

**Last Updated:** 2026-01-25
