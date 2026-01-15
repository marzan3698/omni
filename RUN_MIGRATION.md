# Run Call Schedule Migration

To fix the 500 error when creating calls, you need to run the migration SQL file.

## Steps:

1. Open XAMPP Control Panel
2. Start MySQL
3. Open phpMyAdmin or MySQL command line
4. Select database: `omni_db`
5. Run the SQL from: `server/prisma/migrations/add_lead_calls.sql`

## Or via MySQL command line:

```bash
/Applications/XAMPP/xamppfiles/bin/mysql -u root -p omni_db < server/prisma/migrations/add_lead_calls.sql
```

## Or copy-paste the SQL in phpMyAdmin:

Open phpMyAdmin → Select `omni_db` database → SQL tab → Paste the SQL from `server/prisma/migrations/add_lead_calls.sql` → Go

## After running migration:

1. Restart the Node.js server
2. Try creating a call again
