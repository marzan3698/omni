# Conversation Labels Migration - Verification & Setup Guide

## ✅ Migration Status: COMPLETED & TESTED

The conversation labels feature has been fully implemented and the database migration has been successfully applied.

## What Was Done

### 1. Database Migration
- ✅ Created `conversation_labels` table
- ✅ Added all required columns with proper types
- ✅ Created indexes for performance
- ✅ Added foreign key constraints
- ✅ Migration applied to database
- ✅ Prisma client regenerated

### 2. Backend Implementation
- ✅ Added `ConversationLabel` model to Prisma schema
- ✅ Created service methods (addLabel, updateLabel, deleteLabel, getConversationLabels)
- ✅ Updated existing services to include labels
- ✅ Created controller endpoints with validation
- ✅ Added protected routes with authentication

### 3. Frontend Implementation
- ✅ Added TypeScript interfaces
- ✅ Created API functions
- ✅ Added label display in conversation list
- ✅ Added label display in chat header
- ✅ Created label management modal with full CRUD

## Migration Files

### SQL Migration
**File**: `server/prisma/migrations/add_conversation_labels.sql`

This migration creates the `conversation_labels` table with:
- Proper column types and constraints
- Indexes for query performance
- Foreign key relationships
- Idempotent (safe to run multiple times)

### Migration Tracking
**File**: `server/prisma/migrations/.migrations_applied.json`

The migration has been added to the tracking file.

## Verification Steps

### 1. Check Table Exists
```bash
cd server
/Applications/XAMPP/xamppfiles/bin/mysql -u root omni_db -e "DESCRIBE conversation_labels;"
```

Expected output: Should show all 8 columns (id, conversation_id, company_id, name, source, created_by, created_at, updated_at)

### 2. Check Indexes
```bash
/Applications/XAMPP/xamppfiles/bin/mysql -u root omni_db -e "SHOW INDEXES FROM conversation_labels;"
```

Expected output: Should show 4 indexes (PRIMARY, idx_conversation_id, idx_company_id, idx_name)

### 3. Verify Prisma Schema
```bash
cd server
npx prisma validate
```

Expected output: "The schema at prisma/schema.prisma is valid 🚀"

### 4. Regenerate Prisma Client
```bash
npx prisma generate
```

Expected output: Should generate without errors

## Running on Fresh Database

When deploying to a new environment or fresh database:

### Option 1: Run Migration Script
```bash
cd server
./scripts/run-migration-labels.sh
```

### Option 2: Manual SQL Execution
```bash
cd server
# For XAMPP (macOS)
/Applications/XAMPP/xamppfiles/bin/mysql -u root omni_db < prisma/migrations/add_conversation_labels.sql

# For XAMPP (Linux)
/opt/lampp/bin/mysql -u root omni_db < prisma/migrations/add_conversation_labels.sql

# For standard MySQL
mysql -u root -p omni_db < prisma/migrations/add_conversation_labels.sql
```

### Option 3: Run All Migrations
```bash
cd server
for migration in prisma/migrations/*.sql; do
  /Applications/XAMPP/xamppfiles/bin/mysql -u root omni_db < "$migration"
done
```

## Post-Migration Steps

After running the migration:

1. **Regenerate Prisma Client**:
   ```bash
   cd server
   npx prisma generate
   ```

2. **Restart Server**:
   ```bash
   npm run dev
   ```

3. **Test the Feature**:
   - Open inbox in the application
   - Select a conversation
   - Click "Add Label" button
   - Create a label with name and optional source
   - Verify label appears in conversation list and chat header

## Database Schema

```sql
CREATE TABLE `conversation_labels` (
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

## Files Changed

### Backend
- `server/prisma/schema.prisma` - Added ConversationLabel model
- `server/prisma/migrations/add_conversation_labels.sql` - Migration SQL
- `server/prisma/migrations/.migrations_applied.json` - Migration tracking
- `server/src/services/social.service.ts` - Label service methods
- `server/src/controllers/social.controller.ts` - Label controllers
- `server/src/routes/social.routes.ts` - Label routes

### Frontend
- `client/src/lib/social.ts` - Types and API functions
- `client/src/pages/Inbox.tsx` - UI implementation

### Scripts
- `server/scripts/run-migration-labels.sh` - Migration runner script
- `server/scripts/test-labels-migration.js` - Test script

## Testing Checklist

- [x] Migration SQL file created
- [x] Migration applied to database
- [x] Table structure verified
- [x] Indexes verified
- [x] Foreign keys verified
- [x] Prisma schema validated
- [x] Prisma client regenerated
- [x] Backend services tested
- [x] API endpoints created
- [x] Frontend types added
- [x] UI components implemented
- [x] Label display working
- [x] Label management modal working

## Notes

1. **Idempotent Migration**: The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

2. **Multi-Tenancy**: All labels are company-scoped via `company_id` foreign key.

3. **Cascade Delete**: Labels are automatically deleted when:
   - The conversation is deleted
   - The company is deleted

4. **Validation**: 
   - Label name: Required, max 50 characters
   - Label source: Optional, max 100 characters

## Support

If you encounter any issues:

1. Check the migration was applied: `DESCRIBE conversation_labels;`
2. Verify Prisma client is up to date: `npx prisma generate`
3. Check server logs for errors
4. Verify database connection in `.env` file

---

**Migration Status**: ✅ **READY FOR PRODUCTION**

The migration has been tested and verified. It's safe to push to GitHub and deploy.
