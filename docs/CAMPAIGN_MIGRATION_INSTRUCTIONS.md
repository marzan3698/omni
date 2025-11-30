# Campaign Management System - Database Migration Instructions

## Steps to Run Migration

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Run Prisma migration:**
   ```bash
   npx prisma migrate dev --name add_campaigns
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

1. **Campaigns Table:**
   - Campaign name, description
   - Start date and end date
   - Budget (decimal)
   - Campaign type (reach, sale, research)
   - Company relationship

2. **Leads Table Update:**
   - Adds `campaign_id` foreign key column
   - Links leads to campaigns

## Verification

After migration, verify the campaigns table exists:
```sql
SHOW TABLES LIKE 'campaigns';
DESCRIBE campaigns;
DESCRIBE leads;
```

You should see:
- `campaigns` table with all fields
- `leads` table with `campaign_id` column

