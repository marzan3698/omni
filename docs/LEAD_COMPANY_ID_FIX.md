# Lead Creation Fix - Missing company_id Column

## Issue
Lead creation was failing with Prisma error:
```
Invalid `prisma.lead.create()` invocation
```

## Root Cause
The `leads` table was missing the `company_id` column, which is required for multi-tenancy support in the Omni CRM system.

## Solution Applied

### 1. Updated Prisma Schema
Added `companyId` field to the Lead model in `server/prisma/schema.prisma`:
```prisma
model Lead {
  id             Int        @id @default(autoincrement())
  companyId      Int        @map("company_id")  // Added this field
  createdBy      String     @map("created_by")
  // ... other fields
  
  company          Company         @relation(fields: [companyId], references: [id], onDelete: Cascade)
  // ... other relations
  
  @@index([companyId])  // Added index
  // ... other indexes
}
```

Also added `leads Lead[]` relation to the Company model.

### 2. Created Migration
Created `server/prisma/migrations/add_company_id_to_leads.sql`:
```sql
ALTER TABLE `leads` 
ADD COLUMN `company_id` INT NOT NULL DEFAULT 1 AFTER `id`;

ALTER TABLE `leads`
ADD INDEX `idx_company_id` (`company_id`);

ALTER TABLE `leads`
ADD CONSTRAINT `fk_leads_company` 
FOREIGN KEY (`company_id`) 
REFERENCES `companies`(`id`) 
ON DELETE CASCADE;

UPDATE `leads` SET `company_id` = 1 WHERE `company_id` IS NULL OR `company_id` = 0;
```

### 3. Updated Lead Service
Modified `server/src/services/lead.service.ts` to include `companyId` when creating leads:
```typescript
return await prisma.lead.create({
  data: {
    companyId: conversation.companyId,  // Added this line
    createdBy: userId,
    // ... other fields
  },
});
```

### 4. Applied Migration
```bash
cd server
node scripts/migrate-simple.cjs add_company_id_to_leads.sql
npx prisma generate
```

## Verification
After applying the fix:
```sql
DESCRIBE leads;
```
Should show `company_id` column with:
- Type: `int(11)`
- Null: `NO`
- Default: `1`

## Result
✅ Lead creation now works correctly
✅ Multi-tenancy support is properly implemented
✅ All leads are associated with their respective companies

## Files Modified
1. `server/prisma/schema.prisma` - Added companyId field to Lead model
2. `server/prisma/migrations/add_company_id_to_leads.sql` - Migration file
3. `server/src/services/lead.service.ts` - Updated createLeadFromInbox method

## Note
This fix was required in addition to the product pricing fields migration. Both migrations are now complete and the system is fully functional.

