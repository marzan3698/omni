# Update Database Password - Steps

## New Password
```
PaaeraDB2024SecurePass
```

## Steps to Complete

### 1. Update DATABASE_URL in cPanel Node.js Selector

1. Go to **cPanel → Node.js Selector**
2. Find your app (`api.paaera.com`)
3. Click **"Manage"** or **"Edit"**
4. Find `DATABASE_URL` in **Environment Variables**
5. Update to:
   ```
   DATABASE_URL=mysql://paaera_omniuser:PaaeraDB2024SecurePass@localhost:3306/paaera_database_omni
   ```
6. **Save** changes
7. **Stop** the Node.js app, then **Start** it again

### 2. Verify Connection

Run in cPanel terminal:
```bash
cd ~/api
mysql -u paaera_omniuser -pPaaeraDB2024SecurePass -h localhost paaera_database_omni -e "SELECT 'Connection successful!' AS status;"
```

### 3. Test Prisma Connection

```bash
cd ~/api
cat > test-connection.js << 'EOF'
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$connect()
  .then(() => prisma.user.count())
  .then(count => { 
    console.log('✅ Connected! Users:', count); 
    prisma.$disconnect();
    process.exit(0);
  })
  .catch(e => { 
    console.error('❌ Error:', e.message);
    prisma.$disconnect();
    process.exit(1);
  });
EOF

~/nodevenv/api/20/bin/node test-connection.js
```

### 4. Test Login

1. Visit: `https://www.paaera.com/login`
2. Login with your credentials
3. Should work now! ✅

### 5. Monitor Logs (Optional)

Watch logs in real-time:
```bash
cd ~/api
tail -f stderr.log
```

## Benefits of This Password

- ✅ No URL encoding needed (no @, #, %, etc.)
- ✅ Strong password (20+ characters, mixed case, numbers)
- ✅ Easy to manage in cPanel
- ✅ No connection string parsing issues
