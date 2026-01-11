# Lead Product Pricing - Database Migration Instructions

## Overview
This migration adds product pricing fields to the `leads` table to support automatic calculation of purchase price, sale price, and profit for Sales Leads.

## Steps to Run Migration

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Run the migration:**
   ```bash
   npm run migrate
   # or apply specific migration:
   node scripts/migrate-simple.cjs add_product_pricing_to_leads.sql
   ```

3. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

4. **Restart the server:**
   ```bash
   npm run dev
   ```

## What This Migration Adds

### New Columns in `leads` Table:
1. **`product_id`** (INT NULL)
   - Foreign key to `products` table
   - Links Sales Lead to the selected product
   - Indexed for performance

2. **`purchase_price`** (DECIMAL(12, 2) NULL)
   - Purchase price from the selected product
   - Automatically populated from product when creating Sales Lead

3. **`sale_price`** (DECIMAL(12, 2) NULL)
   - Sale price from the selected product
   - Automatically populated from product when creating Sales Lead

4. **`profit`** (DECIMAL(12, 2) NULL)
   - Calculated profit (sale_price - purchase_price)
   - Automatically calculated when creating Sales Lead

### Database Constraints:
- **Index**: `idx_product_id` on `product_id` column
- **Foreign Key**: `fk_leads_product` linking `product_id` to `products(id)` with `ON DELETE SET NULL`

## Verification

After migration, verify the columns exist:
```sql
DESCRIBE leads;
```

You should see:
- `product_id` (int(11)) NULL
- `purchase_price` (decimal(12,2)) NULL
- `sale_price` (decimal(12,2)) NULL
- `profit` (decimal(12,2)) NULL

Check indexes:
```sql
SHOW INDEXES FROM leads WHERE Key_name = 'idx_product_id';
```

Check foreign keys:
```sql
SELECT 
  CONSTRAINT_NAME, 
  TABLE_NAME, 
  COLUMN_NAME, 
  REFERENCED_TABLE_NAME, 
  REFERENCED_COLUMN_NAME 
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'leads' AND CONSTRAINT_NAME = 'fk_leads_product';
```

## Manual Application via phpMyAdmin

If the script doesn't work, you can manually apply the migration:

1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Select the database: `omni_db`
3. Click on "SQL" tab
4. Copy and paste the SQL from `server/prisma/migrations/add_product_pricing_to_leads.sql`
5. Click "Go" to execute

## Features Enabled

After this migration:
- ✅ Sales Leads automatically store product pricing information
- ✅ Profit is calculated and stored in the database
- ✅ Leads table displays profit column with color coding
- ✅ Product information is linked to leads for reporting

## Related Files

- Migration SQL: `server/prisma/migrations/add_product_pricing_to_leads.sql`
- Schema: `server/prisma/schema.prisma` (Lead model)
- Service: `server/src/services/lead.service.ts`
- Controller: `server/src/controllers/lead.controller.ts`
- Frontend: `client/src/pages/Inbox.tsx` (Create Lead modal)
- Frontend: `client/src/pages/Leads.tsx` (Leads table)

