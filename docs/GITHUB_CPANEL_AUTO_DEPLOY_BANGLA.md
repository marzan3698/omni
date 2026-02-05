# GitHub থেকে cPanel এ Automatic Deployment - সম্পূর্ণ গাইড (বাংলা)

## 📋 বিষয়বস্তু

1. [প্রয়োজনীয় জিনিসপত্র](#প্রয়োজনীয়-জিনিসপত্র)
2. [GitHub Repository Setup](#github-repository-setup)
3. [SSH Key তৈরি এবং Setup](#ssh-key-তৈরি-এবং-setup)
4. [cPanel Node.js Application Setup](#cpanel-nodejs-application-setup)
5. [Environment Variables Setup](#environment-variables-setup)
6. [Database Setup](#database-setup)
7. [GitHub Actions Workflow](#github-actions-workflow)
8. [Deployment Process](#deployment-process)
9. [Common Issues এবং Solutions](#common-issues-এবং-solutions)
10. [Verification এবং Testing](#verification-এবং-testing)

---

## প্রয়োজনীয় জিনিসপত্র

### Software এবং Tools:
- ✅ GitHub Account
- ✅ cPanel Access (Node.js support সহ)
- ✅ SSH Access (cPanel terminal)
- ✅ Git installed (local machine এ)
- ✅ Code Editor (VS Code/Cursor)

### cPanel Requirements:
- ✅ Node.js Selector available
- ✅ SSH Access enabled
- ✅ MySQL Database access
- ✅ File Manager access

### Project Requirements:
- ✅ React Frontend (Vite)
- ✅ Node.js Backend (Express)
- ✅ Prisma ORM
- ✅ TypeScript

---

## GitHub Repository Setup

### Step 1: GitHub Repository তৈরি করুন

1. GitHub এ যান: `https://github.com`
2. New repository তৈরি করুন
3. Repository name দিন (যেমন: `omni-crm`)
4. Public বা Private করুন
5. **README.md, .gitignore, license** add করুন না (যদি already আছে)

### Step 2: Local Project কে GitHub এ Push করুন

```bash
# Terminal এ আপনার project folder এ যান
cd /path/to/your/project

# Git initialize করুন (যদি না হয়ে থাকে)
git init

# Remote repository add করুন
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# সব files add করুন
git add .

# Commit করুন
git commit -m "Initial commit"

# Main branch এ push করুন
git branch -M main
git push -u origin main
```

---

## SSH Key তৈরি এবং Setup

### Step 1: SSH Key Generate করুন (Local Machine এ)

```bash
# Terminal এ run করুন
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/cpanel_deploy

# Passphrase দিন (optional, কিন্তু secure)
# Enter passphrase: [আপনার passphrase]
# Enter same passphrase again: [আবার same passphrase]
```

**Output:**
- Private key: `~/.ssh/cpanel_deploy` (এইটা GitHub Secrets এ add করবেন)
- Public key: `~/.ssh/cpanel_deploy.pub` (এইটা cPanel এ add করবেন)

### Step 2: Public Key cPanel এ Add করুন

1. **cPanel → SSH Access** এ যান
2. **Manage SSH Keys** click করুন
3. **Import Key** click করুন
4. **Key Name:** `github-actions-deploy` দিন
5. **Public Key:** `~/.ssh/cpanel_deploy.pub` file এর content copy করে paste করুন
6. **Save** করুন
7. **Authorize** button click করুন

### Step 3: Private Key GitHub Secrets এ Add করুন

1. **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** click করুন
3. **Name:** `SSH_PRIVATE_KEY`
4. **Secret:** `~/.ssh/cpanel_deploy` file এর **সম্পূর্ণ content** copy করে paste করুন
   ```bash
   # Terminal এ run করুন private key দেখতে
   cat ~/.ssh/cpanel_deploy
   ```
5. **Add secret** click করুন

### Step 4: অন্যান্য GitHub Secrets Add করুন

#### SSH_PRIVATE_KEY (already added)
- Private key এর সম্পূর্ণ content

#### CPANEL_HOST
- cPanel server এর hostname/IP
- Example: `secure.paaera.com` বা `123.456.789.0`

#### CPANEL_USER
- cPanel username
- Example: `paaera`

#### SSH_PORT
- SSH port number (usually 2222 cPanel এ)
- Value: `2222`

**Note:** এই secrets গুলো GitHub Actions workflow এ use হবে।

---

## cPanel Node.js Application Setup

### Step 1: Node.js Application তৈরি করুন

1. **cPanel → Node.js Selector** এ যান
2. **Create Application** click করুন
3. **Node.js Version:** `20.x` select করুন (latest stable)
4. **Application Mode:** `Production`
5. **Application Root:** `~/api` (backend এর জন্য)
6. **Application URL:** `api.yourdomain.com` (subdomain setup করুন আগে)
7. **Application Startup File:** `api-dist/server.cjs` (CommonJS wrapper)
8. **Create** click করুন

### Step 2: Subdomain Setup (যদি প্রয়োজন হয়)

1. **cPanel → Subdomains** এ যান
2. **Subdomain:** `api` দিন
3. **Domain:** আপনার main domain select করুন
4. **Document Root:** `~/api` (optional, Node.js app handle করবে)
5. **Create** click করুন

### Step 3: SSL Certificate Setup

1. **cPanel → SSL/TLS Status** এ যান
2. আপনার subdomain (`api.yourdomain.com`) select করুন
3. **Run AutoSSL** click করুন
4. SSL certificate automatically install হবে

---

## Environment Variables Setup

### Step 1: cPanel Node.js Selector এ Environment Variables Add করুন

1. **cPanel → Node.js Selector** → আপনার app → **Manage**
2. **Environment variables** section এ যান
3. নিচের variables গুলো add করুন:

#### DATABASE_URL
```
mysql://username:password@localhost:3306/database_name
```

**Important:** Password এ special characters (`@`, `#`, `%`) থাকলে URL encode করতে হবে:
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`

**Example:**
```
# Wrong (special characters without encoding)
mysql://user:pass@#@localhost:3306/db

# Correct (URL encoded)
mysql://user:pass%40%23%40@localhost:3306/db
```

**Better:** Password এ special characters avoid করুন:
```
mysql://user:SecurePassword123@localhost:3306/db
```

#### JWT_SECRET
```
# Generate a random secret (terminal এ run করুন)
openssl rand -hex 32

# Example output:
93cab639990dff26875c6e1bb318dff4212f4aeb68e7eff25d313450c886acb5
```

#### NODE_ENV
```
production
```

#### PORT
```
5001
```
(বা cPanel Node.js app যে port use করছে)

#### API_URL
```
https://api.yourdomain.com
```

#### CLIENT_URL
```
https://www.yourdomain.com
```
(বা `https://yourdomain.com`)

#### Facebook Webhook (যদি Messenger ব্যবহার করেন)

| Variable | Value |
|----------|--------|
| `FACEBOOK_APP_ID` | Facebook App Dashboard → Basic থেকে App ID |
| `FACEBOOK_APP_SECRET` | Facebook App Dashboard → Basic → App Secret |
| **`FACEBOOK_VERIFY_TOKEN`** | **আপনি নিজে বেছে নেওয়া গোপন টেক্সট** (যেমন: `omni_crm_webhook_2024_secure`) — একই টেক্সট Facebook App → Messenger → Configure webhooks এ Verify token ফিল্ডে দেবেন |
| `FACEBOOK_OAUTH_REDIRECT_URI` | `https://api.yourdomain.com/api/integrations/facebook/callback` |

**Verify Token সম্পর্কে বিস্তারিত:** [CPANEL_ENV_AND_FACEBOOK_VERIFY_TOKEN_BANGLA.md](./CPANEL_ENV_AND_FACEBOOK_VERIFY_TOKEN_BANGLA.md)

### Step 2: Environment Variables Save করুন

1. সব variables add করার পর **Save** click করুন
2. **Stop App** → wait 3 seconds → **Start App** করুন (environment variables reload করার জন্য)

---

## Database Setup

### Step 1: MySQL Database এবং User তৈরি করুন

1. **cPanel → MySQL Databases** এ যান
2. **Create New Database:**
   - Database name: `yourproject_db` (prefix automatically add হবে)
   - **Create Database** click করুন
3. **Create New User:**
   - Username: `yourproject_user` (prefix automatically add হবে)
   - Password: Strong password দিন (special characters avoid করুন)
   - **Create User** click করুন
4. **Add User To Database:**
   - User select করুন
   - Database select করুন
   - **ALL PRIVILEGES** select করুন
   - **Make Changes** click করুন

### Step 2: Database Password Note করুন

**Important:** Password টা note করে রাখুন, `DATABASE_URL` এ use করবেন।

**Password Best Practices:**
- ✅ Minimum 16 characters
- ✅ Uppercase + Lowercase + Numbers
- ✅ Safe special characters: `-`, `_`, `!`, `$`, `*`
- ❌ Avoid: `@`, `#`, `%`, `&`, `?`, `/`, `:`

**Example Good Password:**
```
OmniSecureDB2024Paaera!
```

### Step 3: Database Schema Import করুন

1. **cPanel → phpMyAdmin** এ যান
2. আপনার database select করুন
3. **Import** tab এ যান
4. আপনার SQL file select করুন (`server/prisma/init.sql` বা exported SQL file)
5. **Go** click করুন
6. Import complete হওয়ার পর verify করুন

### Step 4: Prisma Migrations Run করুন (যদি প্রয়োজন হয়)

```bash
# cPanel Terminal এ run করুন
cd ~/api
~/nodevenv/api/20/bin/npm exec -- prisma migrate deploy --schema=./api-prisma/schema.prisma
```

---

## GitHub Actions Workflow

### Step 1: Workflow File তৈরি করুন

`.github/workflows/deploy.yml` file তৈরি করুন:

```yaml
name: Deploy Omni CRM to cPanel

on:
  push:
    branches:
      - main
      - master
  workflow_dispatch: # Manual trigger option

jobs:
  deploy:
    name: Build and Deploy to cPanel
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: |
            client/package-lock.json
            server/package-lock.json
      
      - name: Build Frontend
        working-directory: ./client
        env:
          VITE_API_URL: https://api.yourdomain.com/api
        run: |
          npm ci
          npm run build
          echo "✅ Frontend build completed"
      
      - name: Build Backend
        working-directory: ./server
        run: |
          npm ci
          npx prisma generate
          npm run build
          echo "✅ Backend build completed"
      
      - name: Prepare Deployment Package
        run: |
          mkdir -p deployment-package
          # Copy frontend build
          cp -r client/dist deployment-package/frontend-dist
          # Copy backend build
          cp -r server/dist deployment-package/api-dist
          cp server/package.json deployment-package/api-package.json
          cp server/package-lock.json deployment-package/api-package-lock.json 2>/dev/null || true
          cp -r server/prisma deployment-package/api-prisma
          # Copy CommonJS wrapper for cPanel
          cp server/server.cjs deployment-package/api-dist/server.cjs 2>/dev/null || true
          # Copy pre-generated Prisma Client
          mkdir -p deployment-package/api-prisma-client
          if [ -d "server/node_modules/.prisma" ]; then
            cp -r server/node_modules/.prisma deployment-package/api-prisma-client/.prisma
          fi
          if [ -d "server/node_modules/@prisma/client" ]; then
            cp -r server/node_modules/@prisma/client deployment-package/api-prisma-client/@prisma-client
          fi
          # Create uploads directory structure
          mkdir -p deployment-package/api-uploads/{products,social,tasks,theme}
          echo "✅ Deployment package prepared"
      
      - name: Deploy to cPanel via SSH
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.CPANEL_HOST }}
          username: ${{ secrets.CPANEL_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: ${{ secrets.SSH_PORT || 2222 }}
          source: "deployment-package/"
          target: "~/deployment-temp"
          strip_components: 0
      
      - name: Run Deployment Script on Server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.CPANEL_HOST }}
          username: ${{ secrets.CPANEL_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: ${{ secrets.SSH_PORT || 2222 }}
          script: |
            # Frontend deployment
            echo "Deploying frontend to ~/public_html..."
            rm -rf ~/public_html/*
            cp -r ~/deployment-temp/frontend-dist/* ~/public_html/
            
            # Create .htaccess for React Router
            cat > ~/public_html/.htaccess << 'EOF'
            <IfModule mod_rewrite.c>
              RewriteEngine On
              RewriteBase /
              RewriteRule ^index\.html$ - [L]
              RewriteCond %{REQUEST_FILENAME} !-f
              RewriteCond %{REQUEST_FILENAME} !-d
              RewriteRule . /index.html [L]
              
              # Redirect /install to home
              RewriteRule ^install$ / [R=301,L]
            </IfModule>
            EOF
            
            # Backend deployment
            echo "Deploying backend to ~/api..."
            mkdir -p ~/api
            
            # Handle both possible paths
            if [ -d ~/deployment-temp/deployment-package ]; then
              DEPLOY_SRC=~/deployment-temp/deployment-package
            else
              DEPLOY_SRC=~/deployment-temp
            fi
            
            cp -r $DEPLOY_SRC/api-dist ~/api/
            cp $DEPLOY_SRC/api-package.json ~/api/package.json
            cp $DEPLOY_SRC/api-package-lock.json ~/api/package-lock.json 2>/dev/null || true
            cp -r $DEPLOY_SRC/api-prisma ~/api/
            
            # Copy pre-generated Prisma Client
            if [ -d "$DEPLOY_SRC/api-prisma-client/.prisma" ]; then
              echo "Copying pre-generated Prisma Client..."
              mkdir -p ~/api/node_modules/.prisma
              cp -r $DEPLOY_SRC/api-prisma-client/.prisma/* ~/api/node_modules/.prisma/ 2>/dev/null || true
            fi
            if [ -d "$DEPLOY_SRC/api-prisma-client/@prisma/client" ]; then
              mkdir -p ~/api/node_modules/@prisma
              cp -r $DEPLOY_SRC/api-prisma-client/@prisma/client ~/api/node_modules/@prisma/client 2>/dev/null || true
            fi
            
            # Install production dependencies
            cd ~/api
            if [ -f "package-lock.json" ]; then
              npm ci --production
            else
              npm install --production
            fi
            
            # Create uploads directory if it doesn't exist
            mkdir -p ~/api/uploads/{products,social,tasks,theme}
            
            # Set permissions
            chmod -R 755 ~/public_html
            chmod -R 755 ~/api
            chmod -R 775 ~/api/uploads
            
            # Cleanup
            rm -rf ~/deployment-temp
            
            echo "✅ Deployment completed successfully!"
            echo "Frontend: ~/public_html"
            echo "Backend: ~/api"
```

### Step 2: Workflow File Customize করুন

**Important:** এই values গুলো আপনার project অনুযায়ী change করুন:

1. **VITE_API_URL:** `https://api.yourdomain.com/api` (line 30)
2. **Application paths:** আপনার cPanel structure অনুযায়ী
3. **Domain names:** আপনার actual domain

### Step 3: CommonJS Wrapper File তৈরি করুন

`server/server.cjs` file তৈরি করুন (যদি না থাকে):

```javascript
// CommonJS wrapper for cPanel Node.js launcher
// This file allows cPanel to require() the ES module

require('dotenv').config();

// Dynamically import the ES module
import('./api-dist/server.js')
  .then(() => {
    console.log('✅ ES Module loaded successfully');
  })
  .catch((error) => {
    console.error('❌ Failed to load ES Module:', error);
    process.exit(1);
  });
```

---

## Deployment Process

### Step 1: Code Push করুন

```bash
# Local machine এ
git add .
git commit -m "Your commit message"
git push origin main
```

### Step 2: GitHub Actions Monitor করুন

1. **GitHub Repository** → **Actions** tab এ যান
2. Latest workflow run click করুন
3. Real-time progress দেখুন
4. সব steps ✅ হলে deployment successful

### Step 3: cPanel এ Verify করুন

1. **File Manager** → `~/public_html` check করুন (frontend files)
2. **File Manager** → `~/api` check করুন (backend files)
3. **Node.js Selector** → App status check করুন (Running হওয়া উচিত)

---

## Common Issues এবং Solutions

### Issue 1: "Authentication failed" - SSH Connection

**Error:**
```
Permission denied (publickey)
```

**Solution:**
1. SSH key properly authorized হয়েছে কিনা check করুন
2. Public key cPanel এ correctly add হয়েছে কিনা verify করুন
3. Private key GitHub Secrets এ correctly add হয়েছে কিনা check করুন

### Issue 2: "Database connection failed"

**Error:**
```
empty host in database URL
```

**Solution:**
1. `DATABASE_URL` এ password URL encoded হয়েছে কিনা check করুন
2. Password এ `@`, `#` থাকলে `%40`, `%23` এ convert করুন
3. Better: Password এ special characters avoid করুন

**Test Database Connection:**
```bash
cd ~/api
mysql -u username -pPassword -h localhost database_name -e "SELECT 1;"
```

### Issue 3: "Prisma Client not found"

**Error:**
```
PrismaClientInitializationError
```

**Solution:**
1. `schema.prisma` এ `binaryTargets` add করুন:
   ```prisma
   generator client {
     provider      = "prisma-client-js"
     binaryTargets = ["native", "debian-openssl-1.0.x"]
   }
   ```
2. GitHub Actions workflow এ Prisma Client pre-generate হচ্ছে কিনা check করুন

### Issue 4: "Images not showing"

**Error:**
Images upload হচ্ছে কিন্তু display হচ্ছে না

**Solution:**
1. `VITE_API_URL` GitHub Actions build step এ set হয়েছে কিনা check করুন
2. Frontend এ `getImageUrl()` utility function use হচ্ছে কিনা verify করুন
3. Backend static file serving (`/uploads`) properly configured হয়েছে কিনা check করুন

### Issue 5: "ERR_REQUIRE_ESM" Error

**Error:**
```
Error [ERR_REQUIRE_ESM]: require() of ES Module not supported
```

**Solution:**
1. `server.cjs` CommonJS wrapper file আছে কিনা check করুন
2. cPanel Node.js app এর startup file `api-dist/server.cjs` set হয়েছে কিনা verify করুন

### Issue 6: "Port already in use"

**Error:**
```
Port 5001 is already in use
```

**Solution:**
1. cPanel Node.js app stop করুন
2. Environment variable `PORT` check করুন
3. App restart করুন

### Issue 7: "Build failed - TypeScript errors"

**Error:**
```
TS6133: 'variable' is declared but its value is never read
```

**Solution:**
1. `tsconfig.json` এ strict mode disable করুন:
   ```json
   {
     "compilerOptions": {
       "strict": false,
       "noUnusedLocals": false,
       "noUnusedParameters": false
     }
   }
   ```
2. Build script এ type checking skip করুন:
   ```json
   {
     "scripts": {
       "build": "vite build"
     }
   }
   ```

---

## Verification এবং Testing

### Step 1: Frontend Test করুন

1. Browser এ `https://www.yourdomain.com` visit করুন
2. Landing page load হচ্ছে কিনা check করুন
3. Login page কাজ করছে কিনা test করুন

### Step 2: Backend API Test করুন

1. Browser এ `https://api.yourdomain.com/health` visit করুন
2. Response: `{"success":true,"message":"Server is running"}` হওয়া উচিত

### Step 3: Database Connection Test করুন

```bash
# cPanel Terminal এ
cd ~/api
cat > test-db.cjs << 'EOF'
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

~/nodevenv/api/20/bin/node test-db.cjs
```

### Step 4: Image Upload Test করুন

1. Login করুন
2. **Theme Design** page এ যান
3. Logo upload করুন
4. Logo display হচ্ছে কিনা check করুন
5. Sidebar এ logo দেখাচ্ছে কিনা verify করুন

### Step 5: Logs Check করুন

```bash
# cPanel Terminal এ
cd ~/api
tail -f stderr.log
```

Errors থাকলে logs এ দেখাবে।

---

## Important Notes

### Security Best Practices

1. ✅ **Never commit** `.env` files
2. ✅ **Never commit** `node_modules/`
3. ✅ **Never commit** `uploads/` directory
4. ✅ **Use strong passwords** (avoid special characters in database passwords)
5. ✅ **Keep SSH keys secure** (never share private keys)

### File Structure

```
~/public_html/          # Frontend (React build)
~/api/                  # Backend (Node.js app)
  ├── api-dist/         # Compiled JavaScript
  ├── api-prisma/       # Prisma schema
  ├── node_modules/     # Dependencies
  ├── uploads/          # Uploaded files
  │   ├── products/
  │   ├── social/
  │   ├── tasks/
  │   └── theme/
  └── package.json
```

### Environment Variables Checklist

- [ ] `DATABASE_URL` (URL encoded password)
- [ ] `JWT_SECRET` (random hex string)
- [ ] `NODE_ENV=production`
- [ ] `PORT` (cPanel Node.js port)
- [ ] `API_URL` (full API URL)
- [ ] `CLIENT_URL` (full frontend URL)

### Deployment Checklist

- [ ] GitHub repository created
- [ ] SSH keys generated and added
- [ ] GitHub Secrets configured
- [ ] cPanel Node.js app created
- [ ] Environment variables set
- [ ] Database created and imported
- [ ] GitHub Actions workflow file created
- [ ] Code pushed to main branch
- [ ] Deployment successful
- [ ] Frontend accessible
- [ ] Backend API working
- [ ] Database connected
- [ ] Images uploading and displaying

---

## Troubleshooting Commands

### Check Node.js App Status
```bash
# cPanel Terminal
cd ~/api
ls -la
cat package.json
```

### Check Environment Variables
```bash
cd ~/api
~/nodevenv/api/20/bin/node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL ? 'DATABASE_URL: SET' : 'DATABASE_URL: NOT SET');"
```

### Check File Permissions
```bash
ls -la ~/public_html
ls -la ~/api
```

### Restart Node.js App
1. cPanel → Node.js Selector
2. App select করুন
3. **Stop** → wait 3 seconds → **Start**

### View Application Logs
```bash
cd ~/api
tail -50 stderr.log
```

---

## Support এবং Resources

### Useful Links
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [cPanel Node.js Documentation](https://docs.cpanel.net/knowledge-base/web-services/guide-to-the-node-js-selector-interface/)
- [Prisma Documentation](https://www.prisma.io/docs)

### Common Commands Reference

```bash
# Git commands
git add .
git commit -m "message"
git push origin main

# SSH key generation
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/cpanel_deploy

# Database connection test
mysql -u username -pPassword -h localhost database_name

# Prisma generate
npx prisma generate

# Node.js version check
node --version
npm --version
```

---

## Conclusion

এই guide follow করলে আপনি successfully GitHub থেকে cPanel এ automatic deployment setup করতে পারবেন। 

**Remember:**
- সব steps carefully follow করুন
- Environment variables correctly set করুন
- Database password URL encode করুন (বা special characters avoid করুন)
- Deployment logs monitor করুন
- Issues হলে troubleshooting section check করুন

**Success Indicators:**
- ✅ GitHub Actions workflow successful
- ✅ Frontend accessible
- ✅ Backend API responding
- ✅ Database connected
- ✅ Images uploading and displaying

---

**Last Updated:** 2026-01-18
**Version:** 1.0
**Author:** Cursor AI Assistant
