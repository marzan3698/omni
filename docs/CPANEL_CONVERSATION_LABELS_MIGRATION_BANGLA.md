# cPanel-এ Conversation Labels Migration গাইড (বাংলা)

## সমস্যা
লোকাল ডাটাবেজে `conversation_labels` টেবিল তৈরি হয়েছে কিন্তু cPanel-এর লাইভ ডাটাবেজে এখনও তৈরি হয়নি।

## সমাধান

### Method 1: phpMyAdmin ব্যবহার করে (সবচেয়ে সহজ)

#### Step 1: phpMyAdmin-এ Login করুন
1. cPanel-এ login করুন
2. **phpMyAdmin** icon-এ click করুন
3. আপনার database select করুন (যেমন: `paaera_database_omni`)

#### Step 2: SQL Tab-এ যান
1. phpMyAdmin-এর top menu-তে **SQL** tab-এ click করুন

#### Step 3: SQL Query Run করুন
এই SQL query টি copy করে paste করুন এবং **Go** button click করুন:

```sql
-- Create conversation_labels table
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

#### Step 4: Verification
1. Left sidebar-এ আপনার database-এর table list check করুন
2. `conversation_labels` table দেখা যাবে
3. Table-এ click করে structure verify করুন

### Method 2: SQL File Import (যদি Method 1 কাজ না করে)

#### Step 1: SQL File তৈরি করুন
Local machine-এ একটি file তৈরি করুন `conversation_labels_migration.sql` নামে এবং এই content add করুন:

```sql
-- Create conversation_labels table
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

#### Step 2: phpMyAdmin-এ Import করুন
1. phpMyAdmin-এ আপনার database select করুন
2. **Import** tab-এ click করুন
3. **Choose File** button click করুন
4. `conversation_labels_migration.sql` file select করুন
5. **Go** button click করুন

### Method 3: cPanel Terminal ব্যবহার করে (Advanced)

#### Step 1: Terminal Access করুন
1. cPanel-এ **Terminal** বা **SSH** access করুন

#### Step 2: MySQL Command Run করুন
```bash
mysql -u your_username -p your_database_name < /path/to/conversation_labels_migration.sql
```

**Note:** `your_username` এবং `your_database_name` আপনার actual credentials দিয়ে replace করুন।

---

## Verification Checklist

Migration successful হয়েছে কিনা verify করার জন্য:

1. ✅ phpMyAdmin-এ `conversation_labels` table দেখা যাচ্ছে
2. ✅ Table-এ 8টি columns আছে:
   - `id`
   - `conversation_id`
   - `company_id`
   - `name`
   - `source`
   - `created_by`
   - `created_at`
   - `updated_at`
3. ✅ 3টি indexes আছে:
   - `idx_conversation_id`
   - `idx_company_id`
   - `idx_name`
4. ✅ Foreign keys properly set আছে

---

## Troubleshooting

### Error: Table already exists
**Solution:** এই error ignore করতে পারেন। `CREATE TABLE IF NOT EXISTS` ব্যবহার করলে table already থাকলে error দেবে না।

### Error: Foreign key constraint fails
**Solution:** 
- Verify করুন `social_conversations` table exists
- Verify করুন `companies` table exists
- Check করুন table names correct আছে

### Error: Access denied
**Solution:**
- Database user-এর proper permissions আছে কিনা check করুন
- cPanel MySQL Databases section-এ user permissions verify করুন

---

## Next Steps

Migration complete হওয়ার পর:

1. **Prisma Client Regenerate করুন** (যদি server-এ access থাকে):
   ```bash
   cd ~/api
   npx prisma generate
   ```

2. **Node.js App Restart করুন**:
   - cPanel → Node.js Selector
   - আপনার app-এ **Restart** button click করুন

3. **Test করুন**:
   - Application-এ login করুন
   - Inbox-এ যান
   - একটি conversation select করুন
   - "Add Label" button test করুন

---

**Important:** Migration run করার আগে **database backup** নিন!
