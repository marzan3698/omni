# cPanel-এ Chatwoot Messages না দেখানোর সমস্যা সমাধান (বাংলা)

## সমস্যা
লাইভ সার্ভারে নতুন code push করার পর ইনবক্সে Chatwoot messages দেখা যাচ্ছে না।

## সম্ভাব্য কারণসমূহ

### 1. Company ID Mismatch
লোকাল এবং লাইভ সার্ভারে আলাদা Chatwoot account ব্যবহার করা হচ্ছে, তাই `company_id` match নাও করতে পারে।

### 2. Integration Configuration
Chatwoot integration-এর `companyId` properly set নেই।

### 3. Database Query Issue
Conversations query-তে `companyId` filter properly কাজ করছে না।

---

## Step-by-Step Solution

### Step 1: cPanel Database-এ Chatwoot Conversations Check করুন

#### phpMyAdmin-এ যান:
1. cPanel → **phpMyAdmin**
2. আপনার database select করুন
3. **SQL** tab-এ এই query run করুন:

```sql
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

#### Check করুন:
- ✅ Chatwoot conversations আছে কিনা
- ✅ `company_id` কি value আছে
- ✅ Messages আছে কিনা (`message_count > 0`)

### Step 2: SuperAdmin User-এর Company ID Check করুন

```sql
SELECT u.id, u.email, u.company_id, c.name as company_name 
FROM users u 
JOIN companies c ON u.company_id = c.id 
WHERE u.email = 'superadmin@omni.com';
```

**Note করুন:**
- SuperAdmin-এর `company_id` কি
- Chatwoot conversations-এর `company_id` কি
- দুটো match করছে কিনা

### Step 3: Chatwoot Integration Check করুন

```sql
SELECT 
  id, 
  provider, 
  account_id, 
  page_id, 
  company_id, 
  is_active, 
  is_webhook_active 
FROM integrations 
WHERE provider = 'chatwoot';
```

**Check করুন:**
- ✅ Integration exists আছে
- ✅ `company_id` correct আছে
- ✅ `is_active = 1` আছে
- ✅ `is_webhook_active = 1` আছে (webhook enable থাকলে)

### Step 4: Company ID Mismatch Fix করুন

যদি Chatwoot conversations-এর `company_id` superadmin-এর `company_id` সাথে match না করে:

#### Option A: Conversations-এর Company ID Update করুন

**সাবধান:** শুধুমাত্র যদি আপনি নিশ্চিত হন যে এই conversations সঠিক company-এর।

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

#### Option B: Integration-এর Company ID Update করুন

```sql
-- Integration-এর company_id check করুন
SELECT id, company_id, account_id 
FROM integrations 
WHERE provider = 'chatwoot';

-- Update করুন (যদি প্রয়োজন হয়)
UPDATE integrations 
SET company_id = 1  -- আপনার superadmin-এর company_id
WHERE provider = 'chatwoot' 
AND company_id != 1;
```

### Step 5: Chatwoot Conversations Sync করুন

#### Method 1: API Endpoint ব্যবহার করে

1. Browser-এ এই URL visit করুন (login করার পর):
   ```
   https://yourdomain.com/api/chatwoot/sync
   ```

2. অথবা Postman/cURL ব্যবহার করুন:
   ```bash
   curl -X POST https://yourdomain.com/api/chatwoot/sync \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

#### Method 2: Database-এ Direct Check করুন

```sql
-- Check করুন latest Chatwoot conversations
SELECT 
  c.id,
  c.platform,
  c.external_user_id,
  c.external_user_name,
  c.company_id,
  c.last_message_at,
  COUNT(m.id) as message_count
FROM social_conversations c
LEFT JOIN social_messages m ON c.id = m.conversation_id
WHERE c.platform = 'chatwoot'
GROUP BY c.id
ORDER BY c.last_message_at DESC
LIMIT 10;
```

### Step 6: Server Logs Check করুন

#### cPanel-এ Logs দেখুন:
1. cPanel → **Node.js Selector**
2. আপনার app select করুন
3. **View Logs** button click করুন
4. এই errors খুঁজুন:
   - `Chatwoot conversation not found`
   - `Company ID mismatch`
   - `Integration not found`

### Step 7: Frontend API Call Verify করুন

Browser Console-এ check করুন:
1. Application-এ login করুন
2. Inbox page-এ যান
3. Browser Developer Tools খুলুন (F12)
4. **Network** tab-এ যান
5. `/api/conversations` request check করুন
6. Response-এ Chatwoot conversations আছে কিনা দেখুন

---

## Common Issues & Solutions

### Issue 1: Chatwoot Conversations Wrong Company ID-তে আছে

**Solution:**
```sql
-- সব Chatwoot conversations-এর company_id update করুন
UPDATE social_conversations 
SET company_id = 1  -- আপনার correct company_id
WHERE platform = 'chatwoot';
```

### Issue 2: Integration-এর Company ID Wrong

**Solution:**
```sql
-- Integration update করুন
UPDATE integrations 
SET company_id = 1  -- আপনার correct company_id
WHERE provider = 'chatwoot';
```

### Issue 3: Messages আছে কিন্তু Conversations Show হচ্ছে না

**Check করুন:**
- Query-তে `companyId` filter properly কাজ করছে কিনা
- Frontend-এ API response check করুন
- Browser console-এ errors আছে কিনা

### Issue 4: Webhook থেকে New Messages আসছে না

**Solution:**
1. Chatwoot integration-এ webhook URL verify করুন
2. `isWebhookActive = true` আছে কিনা check করুন
3. Webhook URL: `https://yourdomain.com/api/chatwoot/webhooks/chatwoot`

---

## Verification Steps

Migration এবং fix করার পর verify করুন:

1. ✅ `conversation_labels` table cPanel-এ তৈরি হয়েছে
2. ✅ Chatwoot conversations-এর `company_id` correct
3. ✅ Integration-এর `company_id` correct
4. ✅ Inbox-এ Chatwoot conversations দেখা যাচ্ছে
5. ✅ Messages properly load হচ্ছে
6. ✅ Labels add/edit/delete কাজ করছে

---

## Important Notes

1. **Backup:** কোনো database change করার আগে backup নিন
2. **Testing:** Production-এ change করার আগে test করুন
3. **Logs:** Server logs regularly check করুন
4. **Company ID:** সবসময় verify করুন `company_id` correct আছে

---

## Support

যদি সমস্যা persists করে:
1. Server logs share করুন
2. Database query results share করুন
3. Browser console errors share করুন
