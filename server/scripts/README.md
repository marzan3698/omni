# Database Migration System

This directory contains scripts for managing database migrations.

## Migration Runner

The migration system automatically applies SQL files from `server/prisma/migrations/` directory.

### Usage

**Apply all pending migrations:**
```bash
npm run migrate
# or
node server/scripts/migrate-simple.cjs
```

**Apply a specific migration:**
```bash
node server/scripts/migrate-simple.cjs migration-file.sql
```

**Force apply (even if already applied):**
```bash
node server/scripts/migrate-simple.cjs migration-file.sql --force
```

### How It Works

1. **Migration Files**: SQL migration files are stored in `server/prisma/migrations/`
   - Each migration should be a `.sql` file
   - Files are applied in alphabetical order

2. **Migration Tracker**: The system tracks applied migrations in `.migrations_applied.json`
   - This file is automatically created and updated
   - Never edit this file manually

3. **Database Connection**: Uses credentials from `server/.env`:
   - `DATABASE_URL` (preferred) or
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

### Creating New Migrations

1. Create a new SQL file in `server/prisma/migrations/`
2. Name it descriptively: `YYYY-MM-DD-description.sql` or `add_feature_name.sql`
3. Write your SQL statements
4. Run `npm run migrate` to apply it

### Example Migration File

```sql
-- Add new table
CREATE TABLE IF NOT EXISTS `new_table` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index
ALTER TABLE `new_table` ADD INDEX `idx_name` (`name`);
```

### Troubleshooting

**Error: Connection refused**
- Make sure MySQL/XAMPP is running
- Check if MySQL is listening on the correct port (usually 3306)

**Error: Access denied**
- Check database credentials in `.env` file
- Default XAMPP credentials: user=`root`, password=`` (empty)

**Migration already applied**
- The system prevents applying the same migration twice
- Use `--force` flag to reapply (use with caution)

### Manual Application via phpMyAdmin

If the script doesn't work, you can manually apply migrations:

1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Select the database: `omni_db`
3. Click on "SQL" tab
4. Copy and paste the SQL from the migration file
5. Click "Go" to execute

After manual application, you can mark it as applied by adding the filename to `.migrations_applied.json`.

