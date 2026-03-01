# Omni Server Migration Guide (AlmaLinux / MariaDB)

> **Last updated:** March 2026  
> All 68 migrations successfully applied on AlmaLinux server with MariaDB.

---

## ✅ One-Command Setup (Fresh Install)

```bash
cd ~/omni-repo && git pull && cd server && \
  mysql -u root -pOmniDB2024Secure -h 127.0.0.1 -e "DROP DATABASE IF EXISTS omni_db; CREATE DATABASE omni_db;" && \
  echo '[]' > prisma/migrations/.migrations_applied.json && \
  node scripts/migrate-simple.cjs
```

> ⚠️ Change `-pOmniDB2024Secure` to your actual password if different.

---

## ⚠️ Why Localhost Works But Server Doesn't

| Issue | Localhost (XAMPP) | Server (AlmaLinux) |
|---|---|---|
| DB Engine | MySQL | MariaDB |
| FK naming | `leads_assigned_to_fkey` | `leads_ibfk_1` (auto-generated) |
| `DELIMITER` | Supported by client | ❌ Not valid SQL — only works in CLI |
| `ADD COLUMN IF NOT EXISTS` | Sometimes needed | Required — same column can't exist twice |

The `migrate-simple.cjs` runner **splits SQL by `;`** and sends each statement individually to MariaDB. This means:
- `DELIMITER //` is invalid (client-only command)
- `PREPARE/EXECUTE` with multi-statement `CONCAT` breaks
- Stored procedures require `DELIMITER` so they can't be used

---

## 🐛 Bugs Fixed (Summary)

### 1. Alphabetical Migration Order — Table Doesn't Exist Yet
Migrations run in **alphabetical filename order**. Files that `ALTER` a table before another migration creates it will fail.

| File that failed | Depended on table | Solution |
|---|---|---|
| `add_campaign_project_invoice.sql` | `campaigns` | Renamed to `add_campaign_0_table.sql` |
| `add_campaigns_table_invoice.sql` | `projects` | Renamed to `add_z_campaigns_table_invoice.sql` |
| `add_payment_system.sql` | `projects` | Moved `ALTER TABLE projects` to `add_z_projects_status_enum.sql` |
| `add_product_lead_customer_points.sql` | `products` | Renamed to `add_z_product_lead_customer_points.sql` |
| `add_service_delivery_toggle...sql` | `services` | Moved `ALTER TABLE services` to `add_z_services_extra.sql` |
| `add_services_and_project_invoice.sql` | `projects` | Moved `ALTER TABLE projects` to `add_z_projects_status_enum.sql` |

**Rule:** If a migration modifies a table created by a later migration, prefix its filename with `add_z_` so it runs last.

---

### 2. PREPARE/EXECUTE/CONCAT Pattern — Breaks in Node.js Runner
The runner splits SQL on `;`, so `CONCAT('ALTER TABLE ... ; ALTER TABLE ...')` inside `PREPARE` gets broken into invalid fragments.

**❌ Don't use:**
```sql
SET @sql = IF(@exists = 0, CONCAT('ALTER TABLE x ...'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
```

**✅ Use instead:**
```sql
ALTER TABLE x ADD COLUMN IF NOT EXISTS col_name INT NULL;
```

Files fixed: `add_pending_status_and_started_at_safe.sql`, `fix_lead_import_id.sql`

---

### 3. DELIMITER Keyword — Not Valid SQL
`DELIMITER` is a MySQL **client** command, not real SQL. It doesn't work when SQL is sent programmatically.

**❌ Don't use:**
```sql
DELIMITER //
CREATE PROCEDURE ...
END //
DELIMITER ;
```

**✅ Use instead:** Simple `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` statements.

File fixed: `add_lead_priority_labels_status_complete.sql`

---

### 4. Wrong Foreign Key Name in MariaDB
MariaDB auto-names FKs as `tablename_ibfk_N` (e.g. `leads_ibfk_1`) instead of the Prisma-generated name `leads_assigned_to_fkey`.

**❌ Fails silently:**
```sql
ALTER TABLE leads DROP FOREIGN KEY IF EXISTS leads_assigned_to_fkey;
ALTER TABLE leads DROP COLUMN IF EXISTS assigned_to; -- still fails!
```

**✅ Fix:**
```sql
SET FOREIGN_KEY_CHECKS=0;
ALTER TABLE leads DROP FOREIGN KEY IF EXISTS leads_assigned_to_fkey;
ALTER TABLE leads DROP FOREIGN KEY IF EXISTS leads_ibfk_1;
ALTER TABLE leads DROP COLUMN IF EXISTS assigned_to;
SET FOREIGN_KEY_CHECKS=1;
```

File fixed: `replace_assigned_to_with_lead_assignments.sql`

---

### 5. Missing Column in init.sql Base Schema
The `leads` table in `init.sql` was missing the `description` column which later migrations expected.

**Fix:** Added `description TEXT,` to the `leads` table in `server/prisma/init.sql`.

---

## 📋 Migration Rules for New Files

When adding a new migration file, follow these rules:

1. **Name with `add_z_` prefix** if it depends on a table created by another migration
2. **Never use `DELIMITER`** — use `IF NOT EXISTS` instead
3. **Never use `PREPARE/EXECUTE/CONCAT`** — use direct `ADD COLUMN IF NOT EXISTS`
4. **For FK drops**, always include `SET FOREIGN_KEY_CHECKS=0` and try all possible FK name variants
5. **Use `IF NOT EXISTS` / `IF EXISTS`** on all `CREATE TABLE`, `ADD COLUMN`, `ADD INDEX`, `DROP TABLE`

---

## 🔄 To Re-run All Migrations From Scratch

```bash
cd ~/omni-repo && git pull
cd server
mysql -u root -pOmniDB2024Secure -h 127.0.0.1 -e "DROP DATABASE IF EXISTS omni_db; CREATE DATABASE omni_db;"
echo '[]' > prisma/migrations/.migrations_applied.json
node scripts/migrate-simple.cjs
```

## 🔄 To Apply Only New Migrations (Without Resetting)

```bash
cd ~/omni-repo && git pull
cd server
node scripts/migrate-simple.cjs
```
