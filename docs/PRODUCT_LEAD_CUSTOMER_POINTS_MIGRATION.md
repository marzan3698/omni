# Product Lead Point & Customer Point - Database Migration

## Overview

This migration adds two optional decimal fields to the `products` table:

- **`lead_point`** – লিড পয়েন্ট (e.g. 10 or 10.2)
- **`customer_point`** – কাস্টমার পয়েন্ট (e.g. 10 or 10.2)

Values are stored as `DECIMAL(10, 2)` so both whole numbers and decimals (like ১০.২) are supported.

## Steps to Run Migration

### Option 1: Using the project migration script (recommended)

1. **Ensure MySQL is running** (e.g. XAMPP MySQL).

2. **From project root, run the specific migration:**
   ```bash
   cd server
   node scripts/migrate-simple.cjs add_product_lead_customer_points.sql
   ```

   Or run all pending migrations:
   ```bash
   cd server
   npm run migrate
   ```

3. **Regenerate Prisma Client** (if needed):
   ```bash
   npx prisma generate
   ```

4. **Restart the server** if it is running.

### Option 2: Manual application via phpMyAdmin

1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Select the database: `omni_db`
3. Click the **SQL** tab
4. Copy and paste the SQL from `server/prisma/migrations/add_product_lead_customer_points.sql`:
   ```sql
   -- Add lead_point and customer_point to products table (optional decimal fields)
   ALTER TABLE `products`
     ADD COLUMN `lead_point` DECIMAL(10, 2) NULL AFTER `quick_replies`,
     ADD COLUMN `customer_point` DECIMAL(10, 2) NULL AFTER `lead_point`;
   ```
5. Click **Go** to execute.

### Option 3: MySQL command line

```bash
/Applications/XAMPP/xamppfiles/bin/mysql -u root -p omni_db < server/prisma/migrations/add_product_lead_customer_points.sql
```

(Adjust the path to `mysql` if your setup is different.)

## What This Migration Adds

### New columns in `products` table

| Column          | Type           | Nullable | Description                    |
|----------------|----------------|----------|--------------------------------|
| `lead_point`   | DECIMAL(10, 2) | YES      | লিড পয়েন্ট (e.g. 10, 10.2)   |
| `customer_point` | DECIMAL(10, 2) | YES    | কাস্টমার পয়েন্ট (e.g. 10, 10.2) |

Both columns are optional (NULL allowed) so existing products are unchanged.

## Verification

After migration, check that the columns exist:

```sql
DESCRIBE products;
```

You should see:

- `lead_point` – decimal(10,2) YES
- `customer_point` – decimal(10,2) YES

## Features Enabled

After this migration:

- Add/Edit Product form shows **Lead Point** and **Customer Point** in Step 1 (Basic Information).
- Values like 10 or 10.2 are saved and loaded correctly.
- Existing products have `NULL` for these fields until edited.

## Related Files

- **Migration SQL:** `server/prisma/migrations/add_product_lead_customer_points.sql`
- **Schema:** `server/prisma/schema.prisma` (Product model)
- **Service:** `server/src/services/product.service.ts`
- **Controller:** `server/src/controllers/product.controller.ts`
- **Frontend:** `client/src/pages/ProductForm.tsx`

## See Also

- [RUN_MIGRATION.md](../RUN_MIGRATION.md) – General migration run steps
- [LEAD_PRICING_MIGRATION_INSTRUCTIONS.md](LEAD_PRICING_MIGRATION_INSTRUCTIONS.md) – Similar migration doc pattern
