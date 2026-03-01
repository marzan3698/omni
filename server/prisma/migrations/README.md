# Database Migrations

This directory contains SQL migration files for the Omni CRM database.

## Running Migrations

### For XAMPP (macOS)
```bash
cd server
/Applications/XAMPP/xamppfiles/bin/mysql -u root omni_db < prisma/migrations/add_conversation_labels.sql
```

### For XAMPP (Linux)
```bash
cd server
/opt/lampp/bin/mysql -u root omni_db < prisma/migrations/add_conversation_labels.sql
```

### For Standard MySQL Installation
```bash
cd server
mysql -u root -p omni_db < prisma/migrations/add_conversation_labels.sql
```

### Using the Migration Script
```bash
cd server
./scripts/run-migration-labels.sh
```

## Migration: add_conversation_labels.sql

**Purpose**: Creates the `conversation_labels` table for labeling inbox conversations.

**Table Structure**:
- `id` - Primary key (auto-increment)
- `conversation_id` - Foreign key to `social_conversations`
- `company_id` - Foreign key to `companies` (multi-tenancy)
- `name` - Label name (VARCHAR(50), required)
- `source` - Label source (VARCHAR(100), optional)
- `created_by` - User ID who created the label (VARCHAR(36))
- `created_at` - Timestamp
- `updated_at` - Auto-updated timestamp

**Indexes**:
- Primary key on `id`
- Index on `conversation_id`
- Index on `company_id`
- Index on `name`

**Foreign Keys**:
- `conversation_id` → `social_conversations(id)` ON DELETE CASCADE
- `company_id` → `companies(id)` ON DELETE CASCADE

## Verification

After running the migration, verify it worked:

```sql
DESCRIBE conversation_labels;
SHOW INDEXES FROM conversation_labels;
```

## Important Notes

1. **Always backup your database** before running migrations
2. Migrations are **idempotent** (use `CREATE TABLE IF NOT EXISTS`)
3. The migration tracking file `.migrations_applied.json` should be updated after successful migration
4. After running migrations, regenerate Prisma client: `npx prisma generate`

## Migration Guidelines (Prevention)

- **Execution order**: Migrations run in **alphabetical order**. If migration B alters a table created by migration A, ensure B's filename sorts after A (e.g. `add_lead_meetings.sql` before `add_lead_meetings_assigned_to.sql`).
- **Avoid duplicate DDL**: Before adding a new migration that adds a column/index, search existing migrations for the same table/column.
- **Prefer idempotency**: For `ADD COLUMN` / `ADD INDEX`, use INFORMATION_SCHEMA + PREPARE/EXECUTE when MySQL compatibility is required.
- **MariaDB-only**: `ADD COLUMN IF NOT EXISTS` works on MariaDB; use it only if the deployment target is known to be MariaDB.
- **Consolidation**: When fixing redundant migrations, prefer making them idempotent over converting to no-ops, so fresh installs and partial runs both work.

## Fresh Database Setup

When setting up a new database, run all migrations in order:

```bash
# Run all migrations
for migration in prisma/migrations/*.sql; do
  mysql -u root omni_db < "$migration"
done
```
