# Database Setup – Alternative Methods

যদি `node scripts/migrate-simple.cjs` বারবার fail করে (errno 150, syntax error ইত্যাদি), নিচের বিকল্পগুলো ব্যবহার করতে পারেন।

---

## পদ্ধতি ১: মাইগ্রেশন ফিক্স করা (বর্তমান)

মাইগ্রেশন স্ক্রিপ্ট ও ফাইলগুলো ঠিক করে push করা হচ্ছে। সার্ভারে pull করে আবার চালান:

```bash
cd ~/omni-repo && git pull origin main
cd server && node scripts/migrate-simple.cjs
```

---

## পদ্ধতি ২: Prisma db push (ফ্রেশ ডাটাবেস)

পুরোপুরি নতুন ডাটাবেস তৈরি করতে চাইলে। **সব ডাটা মুছে যাবে**।

```bash
# ১. Database drop করে নতুন তৈরি করুন
mysql -u root -p -h 127.0.0.1 -e "DROP DATABASE IF EXISTS omni_db; CREATE DATABASE omni_db;"

# ২. Prisma schema থেকে সরাসরি table তৈরি করুন (migration ছাড়া)
cd ~/omni-repo/server
npx prisma db push

# ৩. Seed data ঢোকান (admin user, role ইত্যাদি)
npx prisma db seed

# ৪. PM2 restart
pm2 restart omni
```

---

## পদ্ধতি ৩: phpMyAdmin দিয়ে Import

আপনার লোকাল XAMPP-এ যদি কাজ করা database থাকে:

### Export (লোকাল XAMPP থেকে)

1. phpMyAdmin ওপেন করুন
2. `omni_db` select করুন
3. **Export** tab → **Quick** → **Go**
4. `.sql` ফাইল ডাউনলোড হবে

### Import (VPS সার্ভারে)

1. VPS-এ phpMyAdmin চালু থাকলে সেখানে login করুন
2. Database তৈরি করুন: `omni_db`
3. **Import** tab → ফাইল select করে **Go** চাপুন

### Import (Terminal দিয়ে, phpMyAdmin ছাড়া)

```bash
# লোকাল থেকে export করুন, তারপর SCP দিয়ে সার্ভারে পাঠান
# সার্ভারে:
mysql -u root -pOmniDB2024Secure -h 127.0.0.1 omni_db < /path/to/omni_db_export.sql
```

---

## পদ্ধতি ৪: MySQL/MariaDB দিয়ে সরাসরি Import

`.sql` ফাইল থাকলে:

```bash
mysql -u root -pOmniDB2024Secure -h 127.0.0.1 omni_db < full_database_dump.sql
```

---

## কোনটা ব্যবহার করবেন?

| পরিস্থিতি | পদ্ধতি |
|-----------|--------|
| একটু একটু fix করা migrations দিয়ে চলতে পারছেন | পদ্ধতি ১ |
| নতুন VPS, কোন data নেই | পদ্ধতি ২ (Prisma db push) |
| লোকালে কাজ করা DB আছে, সেটা কপি করতে চান | পদ্ধতি ৩ বা ৪ |
