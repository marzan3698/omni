# Excel Lead Import ও Bulk Assign – লাইভ সার্ভারে ডিপ্লয় গাইড (বাংলা)

## নতুন Database পরিবর্তনগুলো

Excel Lead Import এবং Bulk Assign ফিচারের জন্য নিচের ডাটাবেজ পরিবর্তনগুলো প্রয়োজন:

1. **`leads` টেবিল**: `source` কলামে `Excel` enum value যোগ
2. **`lead_imports` টেবিল**: নতুন টেবিল (আপলোডের batch তথ্য রাখে)
3. **`leads` টেবিল**: `lead_import_id` কলাম (optional FK to lead_imports)

## প্রশ্ন: লাইভ সার্ভারে কি অটোমেটিক এপ্লাই হবে?

**না।** ডাটাবেজ মাইগ্রেশন **অটোমেটিক চালু হয় না।** প্রতিবার নতুন DB পরিবর্তন push করার পর আপনাকে **ম্যানুয়ালি** migration চালাতে হবে।

---

## ⚠️ গুরুত্বপূর্ণ: পুরো `npm run migrate` চালাবেন না

লাইভ সার্ভারে যদি **প্রায় সব টেবিলই আগে থেকেই থাকে** (Prisma db push অথবা অন্য উপায়ে), তাহলে `npm run migrate` চালালে "Table already exists" জাতীয় error আসবে। **শুধু Excel Lead-এর জন্য প্রয়োজনীয় migration** চালান।

---

## cPanel-এ Migration চালানোর পদ্ধতি

### পদ্ধতি ১: শুধু Excel Lead-এর safe migration (সুপারিশকৃত)

**cPanel Terminal বা SSH এ:**

```bash
cd ~/omni-repo/server
source ~/nodevenv/omni-repo/server/20/bin/activate
node scripts/migrate-simple.cjs cpanel_excel_leads_safe.sql
```

এরপর **phpMyAdmin** এ গিয়ে নিচের SQL গুলো চালান (যদি `lead_import_id` কলাম না থাকে):

```sql
ALTER TABLE `leads` ADD COLUMN `lead_import_id` INT NULL;
ALTER TABLE `leads` ADD INDEX `idx_lead_import_id` (`lead_import_id`);
ALTER TABLE `leads` ADD CONSTRAINT `fk_leads_lead_import` FOREIGN KEY (`lead_import_id`) REFERENCES `lead_imports`(`id`) ON DELETE SET NULL;
```

যদি "Duplicate column name" বা "Duplicate key" error আসে তাহলে বুঝবেন ওগুলো ইতিমধ্যে আছে, সেক্ষেত্রে কিছু করতে হবে না।

### পদ্ধতি ২: সম্পূর্ণ add_excel_lead_import (যদি DB একদম fresh হয়)

যদি আপনার লাইভ DB-তে পুরনো migration গুলো চলেনি এবং লিড সম্পর্কিত কোনো স্ট্রাকচার নেই, তাহলে:

```bash
node scripts/migrate-simple.cjs add_excel_lead_import.sql
```

**Excel Lead Import এর জন্য প্রয়োজনীয় migration ফাইলগুলো (অগ্রাধিকার অনুযায়ী):**

1. `cpanel_excel_leads_safe.sql` – শুধু Excel enum + lead_imports টেবিল (নিরাপদ, idempotent)
2. `add_excel_lead_import.sql` – সম্পূর্ণ (enum + lead_imports + lead_import_id + FK)

---

### পদ্ধতি ২: phpMyAdmin দিয়ে ম্যানুয়াল SQL

যদি `npm run migrate` কাজ না করে, **phpMyAdmin** দিয়ে সরাসরি SQL চালান:

1. cPanel → **phpMyAdmin** → আপনার database সিলেক্ট করুন
2. **SQL** ট্যাবে যান
3. নিচের SQL গুলো এক এক করে চালান (প্রথমটি দিয়ে শুরু করুন):

```sql
-- ১. source কলামে Excel যোগ
ALTER TABLE `leads`
MODIFY COLUMN `source` ENUM('Website', 'Referral', 'SocialMedia', 'Email', 'Phone', 'Inbox', 'FacebookPixel', 'Excel', 'Other') NOT NULL DEFAULT 'Website';

-- ২. lead_imports টেবিল তৈরি
CREATE TABLE IF NOT EXISTS `lead_imports` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `company_id` INT NOT NULL,
  `uploaded_by` VARCHAR(36) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `total_rows` INT NOT NULL,
  `success_count` INT NOT NULL DEFAULT 0,
  `error_count` INT NOT NULL DEFAULT 0,
  `error_details` JSON NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_uploaded_by` (`uploaded_by`),
  CONSTRAINT `fk_lead_imports_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lead_imports_user` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ৩. leads এ lead_import_id কলাম যোগ (যদি ইতিমধ্যে থাকে তাহলে এই স্টেপ skip করুন)
ALTER TABLE `leads` ADD COLUMN `lead_import_id` INT NULL;
ALTER TABLE `leads` ADD INDEX `idx_lead_import_id` (`lead_import_id`);
ALTER TABLE `leads` ADD CONSTRAINT `fk_leads_lead_import` FOREIGN KEY (`lead_import_id`) REFERENCES `lead_imports`(`id`) ON DELETE SET NULL;
```

**নোট:** যদি `lead_import_id` কলাম বা `lead_imports` টেবিল ইতিমধ্যে থাকে তাহলে সংশ্লিষ্ট ALTER/CREATE এ error আসতে পারে—সেক্ষেত্রে ওই কমান্ডগুলো বাদ দিয়ে পরেরগুলো চালান।

---

## Deployment পরবর্তী স্টেপস

1. **GitHub এ push** করার পর cPanel এ `git pull origin main`
2. **Migration চালান** (উপরে যে কোনো পদ্ধতি)
3. **Node.js app Restart** করুন: cPanel → Node.js Selector → আপনার app → **Restart**
4. **ফ্রন্ট엔ড রিবিল্ড** (যদি GitHub Actions দিয়ে deploy করেন তাহলে অটো হবে)

---

## New cPanel Setup গাইড কোথায়?

**Admin Panel** থেকে: **System Settings** → **New cPanel Setup**  
রুট: `/admin/cpanel-auto-deployment-guide`

এই পেজে cPanel এ নতুন সেটআপের ধাপগুলো এবং প্রয়োজনীয় কমান্ডগুলো দেওয়া আছে।

---

## যাচাইকরণ

Migration সফল হয়েছে কিনা দেখতে phpMyAdmin এ:

```sql
-- lead_imports টেবিল আছে কিনা
SHOW TABLES LIKE 'lead_imports';

-- leads এ lead_import_id কলাম আছে কিনা
DESCRIBE leads;
```

`lead_import_id` কলাম এবং `lead_imports` টেবিল থাকলে migration সফল।
