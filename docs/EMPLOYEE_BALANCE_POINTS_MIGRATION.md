# Employee Balance & Points Migration Guide

## Overview

এই মাইগ্রেশন Employee টেবিলে ৪টি নতুন ফিল্ড যোগ করে:
- `reserve_balance` - রিজার্ভ ব্যালেন্স
- `main_balance` - মেইন ব্যালেন্স
- `reserve_points` - রিজার্ভ পয়েন্ট
- `main_points` - মেইন পয়েন্ট

## How Points System Works

### রিজার্ভ পয়েন্ট কীভাবে যোগ হয়?
- যখন একজন Customer Care ব্যক্তি ইনবক্স থেকে লিড তৈরি করে
- এবং সেই লিডে একটি প্রোডাক্ট সিলেক্ট করা থাকে
- তখন সেই প্রোডাক্টের `leadPoint` ভ্যালু তার `reservePoints` এ যোগ হয়

### রিজার্ভ থেকে মেইন পয়েন্টে ট্রান্সফার কখন হয়?
- যখন লিডের স্ট্যাটাস "Won" (Complete) হয়
- তখন সেই লিডের প্রোডাক্টের `leadPoint` পরিমাণ পয়েন্ট
  - `reservePoints` থেকে বিয়োগ হয়
  - `mainPoints` এ যোগ হয়

## Migration Steps

### Option 1: Using migrate-simple.cjs Script

```bash
cd server
node scripts/migrate-simple.cjs
```

Script টি automatically `prisma/migrations/add_employee_balance_points.sql` ফাইল apply করবে।

### Option 2: Manual via phpMyAdmin

1. phpMyAdmin এ যান
2. আপনার ডাটাবেস সিলেক্ট করুন
3. SQL ট্যাবে যান
4. নিচের SQL run করুন:

```sql
ALTER TABLE `employees`
  ADD COLUMN `reserve_balance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER `join_date`,
  ADD COLUMN `main_balance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER `reserve_balance`,
  ADD COLUMN `reserve_points` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER `main_balance`,
  ADD COLUMN `main_points` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER `reserve_points`;
```

### Option 3: MySQL CLI

```bash
mysql -u root -p your_database_name < server/prisma/migrations/add_employee_balance_points.sql
```

## After Migration

Migration সফল হলে:

1. Prisma Client regenerate করুন:
```bash
cd server
npx prisma generate
```

2. Server restart করুন:
```bash
npm run dev
```

## Verification

Migration সঠিকভাবে হয়েছে কিনা verify করতে:

```sql
DESCRIBE employees;
```

আউটপুটে নিচের কলামগুলো দেখতে পাবেন:
- `reserve_balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00
- `main_balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00
- `reserve_points` DECIMAL(12,2) NOT NULL DEFAULT 0.00
- `main_points` DECIMAL(12,2) NOT NULL DEFAULT 0.00

## New Features After Migration

### 1. Balance & Points Button (Header)
- Customer Care role এর জন্য header এ "ব্যালেন্স" বাটন দেখা যাবে
- ক্লিক করলে popup এ সব balance ও points দেখা যাবে

### 2. Automatic Points Tracking
- লিড তৈরিতে reservePoints বাড়ে
- লিড complete (Won) হলে mainPoints এ ট্রান্সফার হয়

## API Endpoints

### Get My Balance & Points
```
GET /api/employees/me/balance-points
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "reserveBalance": 0,
    "mainBalance": 0,
    "reservePoints": 10.5,
    "mainPoints": 25.0
  }
}
```

## Related Files

- Schema: `server/prisma/schema.prisma` (Employee model)
- Migration: `server/prisma/migrations/add_employee_balance_points.sql`
- Service: `server/src/services/employee.service.ts`
- Service: `server/src/services/lead.service.ts`
- Controller: `server/src/controllers/employee.controller.ts`
- Route: `server/src/routes/employee.routes.ts`
- Frontend: `client/src/components/Layout.tsx`
