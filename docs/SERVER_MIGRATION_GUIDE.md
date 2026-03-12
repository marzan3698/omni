# Omni Server Setup Guide — AlmaLinux (Hetzner)

> **Status:** ✅ Live at `http://46.225.230.71`  
> **Server:** AlmaLinux 9, aarch64, 8GB RAM — Hetzner  
> **DB:** MariaDB | **Runtime:** Node.js + PM2 | **Web:** Nginx  
> **Last updated:** March 2026

---

## 🖥️ Server Info

| Item | Value |
|---|---|
| Server IP | `46.225.230.71` |
| SSH | `ssh root@46.225.230.71` |
| DB Password | `OmniDB2024Secure` |
| DB Name | `omni_db` |
| API Port | `5001` |
| Frontend | `/usr/share/nginx/html/` |
| Repo Path | `~/omni-repo/` |
| PM2 App Name | `omni` |

---

## 🚀 Full Setup From Scratch (Empty Server)

### Step 1 — Clone the repo
```bash
git clone https://github.com/marzan3698/omni.git ~/omni-repo
cd ~/omni-repo
```

### Step 2 — Install Node.js (if not installed)
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs
node -v  # should show v20.x
```

### Step 3 — Set up database & run all migrations
```bash
cd ~/omni-repo/server
mysql -u root -pOmniDB2024Secure -h 127.0.0.1 -e "DROP DATABASE IF EXISTS omni_db; CREATE DATABASE omni_db;"
echo '[]' > prisma/migrations/.migrations_applied.json
node scripts/migrate-simple.cjs
```

### Step 4 — Install server dependencies & start API
```bash
cd ~/omni-repo/server
npm install
pm2 start dist/server.js --name omni
pm2 save
pm2 startup
```

### Step 5 — Build frontend
```bash
cd ~/omni-repo/client
npm install
npm run build
```

### Step 6 — Install nginx & serve frontend
```bash
dnf install -y nginx

# Configure nginx
cat > /etc/nginx/conf.d/omni.conf << 'EOF'
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# Remove conflicting default server block
sed -n '/^    server {/q;p' /etc/nginx/nginx.conf > /tmp/nginx_top.conf
cat /tmp/nginx_top.conf > /etc/nginx/nginx.conf
echo "}" >> /etc/nginx/nginx.conf

# Copy built files
\cp -rf ~/omni-repo/client/dist/* /usr/share/nginx/html/
rm -f /etc/nginx/default.d/welcome.conf

# Start nginx
systemctl start nginx
systemctl enable nginx
nginx -t && systemctl reload nginx
```

### Step 7 — Open firewall ports
```bash
# firewall-cmd not available on this server — use iptables
iptables -I INPUT -p tcp --dport 80 -j ACCEPT
iptables -I INPUT -p tcp --dport 5001 -j ACCEPT
```

### ✅ Done! Visit: `http://46.225.230.71`

---

## 🔄 Deploy Update (After git push)

```bash
cd ~/omni-repo && git pull

# Run any new migrations
cd server && npm install && node scripts/migrate-simple.cjs

# Rebuild backend API
npm run build

# Rebuild frontend if client code changed
cd ~/omni-repo/client && npm install && npm run build
\cp -rf ~/omni-repo/client/dist/* /usr/share/nginx/html/

# Restart API
pm2 restart omni
```

---

## 🐛 Migration Issues Fixed (MariaDB vs MySQL)

### Why localhost works but server doesn't

| Issue | MySQL (localhost) | MariaDB (server) |
|---|---|---|
| FK names | `leads_assigned_to_fkey` | `leads_ibfk_1` |
| `DELIMITER` | Works in CLI | ❌ Not valid SQL |
| `PREPARE/EXECUTE/CONCAT` | Works | ❌ Breaks (runner splits on `;`) |

The `migrate-simple.cjs` script splits SQL by `;` and sends each statement one by one — so any construct that uses `;` inside a string (CONCAT/PREPARE) breaks.

---

### Bug 1 — Wrong Alphabetical Order (Table Doesn't Exist Yet)

Migrations run **alphabetically**. Some files referenced tables created by later migrations.

| File | Problem | Fix |
|---|---|---|
| `add_campaign_project_invoice.sql` | Referenced `campaigns` before it existed | Renamed to `add_campaign_0_table.sql` |
| `add_campaigns_table_invoice.sql` | Referenced `projects` before it existed | Renamed to `add_z_campaigns_table_invoice.sql` |
| `add_payment_system.sql` | `ALTER TABLE projects` before projects existed | Moved to `add_z_projects_status_enum.sql` |
| `add_product_lead_customer_points.sql` | `ALTER TABLE products` before products existed | Renamed to `add_z_product_lead_customer_points.sql` |
| `add_service_delivery_toggle...sql` | `ALTER TABLE services` before services existed | Moved to `add_z_services_extra.sql` |
| `add_services_and_project_invoice.sql` | `ALTER TABLE projects` before projects existed | Moved to `add_z_projects_status_enum.sql` |

**Rule:** If a migration modifies a table created by a later migration, rename it with `add_z_` prefix.

---

### Bug 2 — PREPARE/EXECUTE/CONCAT Pattern

```sql
-- ❌ BROKEN — semicolons inside CONCAT break the runner
SET @sql = IF(@exists = 0, CONCAT('ALTER TABLE x ...; ALTER TABLE y ...'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ✅ CORRECT — use IF NOT EXISTS directly
ALTER TABLE x ADD COLUMN IF NOT EXISTS col_name INT NULL;
```

Files fixed: `add_pending_status_and_started_at_safe.sql`, `fix_lead_import_id.sql`

---

### Bug 3 — DELIMITER Not Supported

```sql
-- ❌ BROKEN — DELIMITER is a MySQL client command, not SQL
DELIMITER //
CREATE PROCEDURE ...
END //
DELIMITER ;

-- ✅ CORRECT — use ADD COLUMN IF NOT EXISTS instead
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS started_at DATETIME NULL;
```

File fixed: `add_lead_priority_labels_status_complete.sql`

---

### Bug 4 — Wrong FK Name in MariaDB

MariaDB auto-names FKs as `tablename_ibfk_N`, not the Prisma-generated name.

```sql
-- ❌ Fails silently — leaves FK in place, DROP COLUMN fails
ALTER TABLE leads DROP FOREIGN KEY IF EXISTS leads_assigned_to_fkey;

-- ✅ Try both names + disable FK checks
SET FOREIGN_KEY_CHECKS=0;
ALTER TABLE leads DROP FOREIGN KEY IF EXISTS leads_assigned_to_fkey;
ALTER TABLE leads DROP FOREIGN KEY IF EXISTS leads_ibfk_1;
ALTER TABLE leads DROP COLUMN IF EXISTS assigned_to;
SET FOREIGN_KEY_CHECKS=1;
```

File fixed: `replace_assigned_to_with_lead_assignments.sql`

---

### Bug 5 — Missing Column in init.sql

The `description` column was missing from the `leads` table in `init.sql`.  
Fixed by adding `description TEXT,` to the leads table definition in `server/prisma/init.sql`.

---

## 📋 Rules for Writing New Migration Files

1. **Prefix with `add_z_`** if it depends on a table created by a later migration
2. **Never use `DELIMITER`** — use `IF NOT EXISTS` instead
3. **Never use `PREPARE/EXECUTE/CONCAT`** — use direct `ADD COLUMN IF NOT EXISTS`
4. **For FK drops**, always include `SET FOREIGN_KEY_CHECKS=0` and try all possible FK name variants
5. **Use `IF NOT EXISTS`** on all `CREATE TABLE`, `ADD COLUMN`, `ADD INDEX`, `DROP TABLE`

---

## 🔧 Useful Commands

```bash
# Check PM2 status
pm2 list
pm2 logs omni        # live logs
pm2 restart omni

# Test API
curl http://localhost:5001/

# Check nginx
systemctl status nginx
nginx -t

# Check DB tables
mysql -u root -pOmniDB2024Secure -h 127.0.0.1 omni_db -e "SHOW TABLES;"

# Re-run all migrations from scratch
cd ~/omni-repo/server
mysql -u root -pOmniDB2024Secure -h 127.0.0.1 -e "DROP DATABASE IF EXISTS omni_db; CREATE DATABASE omni_db;"
echo '[]' > prisma/migrations/.migrations_applied.json
node scripts/migrate-simple.cjs

# Run only new migrations (without resetting)
cd ~/omni-repo/server && node scripts/migrate-simple.cjs
```


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
