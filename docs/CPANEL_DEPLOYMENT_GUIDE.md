# cPanel Deployment Guide for Omni CRM

This guide will help you deploy your Omni CRM application to cPanel hosting.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [cPanel Requirements](#cpanel-requirements)
3. [Pre-Deployment Preparation](#pre-deployment-preparation)
4. [File Structure on cPanel](#file-structure-on-cpanel)
5. [Database Setup](#database-setup)
6. [Backend Deployment](#backend-deployment)
7. [Frontend Deployment](#frontend-deployment)
8. [Environment Variables](#environment-variables)
9. [Node.js Setup in cPanel](#nodejs-setup-in-cpanel)
10. [File Permissions](#file-permissions)
11. [Domain/Subdomain Configuration](#domainsubdomain-configuration)
12. [Testing & Verification](#testing--verification)
13. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:
- ✅ cPanel access with Node.js support
- ✅ MySQL database access
- ✅ SSH access (recommended, but not required)
- ✅ Domain or subdomain configured
- ✅ Node.js 18+ available in cPanel
- ✅ npm installed

---

## cPanel Requirements

Your cPanel hosting must support:
- **Node.js** (version 18 or higher)
- **MySQL** database
- **File Manager** or **SSH/FTP** access
- **Cron Jobs** (for scheduled tasks, if needed)

---

## Pre-Deployment Preparation

### Step 1: Build the Frontend Locally

On your local machine, build the React frontend:

```bash
cd client
npm install
npm run build
```

This will create a `dist/` folder in the `client/` directory with production-ready files.

### Step 2: Build the Backend Locally

Build the TypeScript backend:

```bash
cd server
npm install
npm run build
```

This will create a `dist/` folder in the `server/` directory.

### Step 3: Prepare Files for Upload

Create a deployment package with:
- ✅ Built frontend files (`client/dist/`)
- ✅ Built backend files (`server/dist/`)
- ✅ Server source files (for Prisma and other runtime needs)
- ✅ `server/prisma/` folder (for migrations)
- ✅ `server/node_modules/` (or install on server)
- ✅ `server/uploads/` folder structure
- ✅ Environment configuration files

---

## File Structure on cPanel

Recommended structure in your cPanel `public_html` or subdomain directory:

```
public_html/
├── api/                    # Backend API (Node.js app)
│   ├── dist/              # Compiled backend files
│   ├── src/               # Source files (if needed)
│   ├── prisma/            # Prisma schema and migrations
│   ├── uploads/           # File uploads directory
│   ├── node_modules/      # Backend dependencies
│   ├── package.json
│   └── .env               # Backend environment variables
│
└── [root or subdomain]/   # Frontend (React build)
    ├── index.html
    ├── assets/
    └── ... (all files from client/dist/)
```

**Alternative Structure (Recommended for Subdomain):**

```
public_html/
├── api.yourdomain.com/    # Backend subdomain
│   └── [backend files]
│
└── yourdomain.com/        # Frontend main domain
    └── [frontend files]
```

---

## Database Setup

### Step 1: Create MySQL Database in cPanel

1. Log into cPanel
2. Go to **MySQL Databases**
3. Create a new database (e.g., `yourusername_omni_crm`)
4. Create a database user
5. Add user to database with **ALL PRIVILEGES**
6. Note down:
   - Database name
   - Database username
   - Database password
   - Database host (usually `localhost`)

### Step 2: Import Database Schema

**Option A: Using Prisma Migrate (Recommended)**

1. Upload `server/prisma/` folder to your server
2. Set up environment variables (see below)
3. Run Prisma migrations:
   ```bash
   cd api
   npx prisma migrate deploy
   ```

**Option B: Using SQL File**

1. Generate SQL from Prisma:
   ```bash
   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > schema.sql
   ```
2. Import `schema.sql` via cPanel **phpMyAdmin**

---

## Backend Deployment

### Step 1: Upload Backend Files

Upload the following to your `api/` directory:
- `server/dist/` → `api/dist/`
- `server/prisma/` → `api/prisma/`
- `server/package.json` → `api/package.json`
- `server/package-lock.json` → `api/package-lock.json`

### Step 2: Install Backend Dependencies

**Via SSH (Recommended):**
```bash
cd ~/public_html/api
npm install --production
```

**Via cPanel Terminal:**
- Use cPanel's **Terminal** feature
- Navigate to your API directory
- Run `npm install --production`

### Step 3: Generate Prisma Client

```bash
cd ~/public_html/api
npx prisma generate
```

### Step 4: Run Database Migrations

```bash
npx prisma migrate deploy
```

---

## Frontend Deployment

### Step 1: Upload Frontend Files

Upload **all contents** of `client/dist/` to your domain root or subdomain directory:
- `index.html`
- `assets/` folder
- All other files from `dist/`

**Important:** Upload the **contents** of `dist/`, not the `dist` folder itself.

### Step 2: Configure .htaccess (if needed)

Create `.htaccess` in your frontend root for React Router:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## Environment Variables

### Backend Environment Variables (`api/.env`)

Create `.env` file in your `api/` directory:

```env
# Server Configuration
NODE_ENV=production
PORT=5001

# Database
DATABASE_URL="mysql://username:password@localhost:3306/database_name"
# Example: DATABASE_URL="mysql://youruser:yourpass@localhost:3306/yourusername_omni_crm"

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars
JWT_EXPIRES_IN=7d

# Client URL (Frontend URL)
CLIENT_URL=https://yourdomain.com
# Or if using subdomain: CLIENT_URL=https://app.yourdomain.com

# API URL (Backend URL)
API_URL=https://api.yourdomain.com
# Or: API_URL=https://yourdomain.com/api

# Facebook Integration (Optional)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_VERIFY_TOKEN=your_verify_token

# Chatwoot Integration (Optional)
CHATWOOT_WEBHOOK_URL=https://api.yourdomain.com/api/chatwoot/webhooks/chatwoot
LIVE_WEBHOOK_URL=https://api.yourdomain.com/api/webhooks/facebook
LOCAL_WEBHOOK_URL=https://api.yourdomain.com/api/webhooks/facebook

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

**Security Note:** 
- Use strong, random values for `JWT_SECRET`
- Never commit `.env` file to version control
- Set proper file permissions (600) on `.env` file

### Frontend Environment Variables

Create `.env.production` in your `client/` directory before building:

```env
VITE_API_URL=https://api.yourdomain.com/api
# Or: VITE_API_URL=https://yourdomain.com/api
```

**Important:** Rebuild frontend after changing this:
```bash
cd client
npm run build
```

---

## Node.js Setup in cPanel

### Step 1: Access Node.js Selector

1. Log into cPanel
2. Find **Node.js Selector** or **Setup Node.js App**
3. Click **Create Application**

### Step 2: Configure Node.js App

Fill in the following:
- **Node.js Version:** 18.x or higher
- **Application Root:** `public_html/api` (or your backend directory)
- **Application URL:** Choose subdomain or path (e.g., `api.yourdomain.com`)
- **Application Startup File:** `dist/server.js`
- **Application Mode:** Production

### Step 3: Set Environment Variables

In the Node.js app settings, add environment variables:
- `NODE_ENV=production`
- `PORT=5001` (or port assigned by cPanel)
- `DATABASE_URL=...`
- `JWT_SECRET=...`
- `CLIENT_URL=...`
- `API_URL=...`

**Note:** Some cPanel versions allow setting env vars in the Node.js app interface.

### Step 4: Start the Application

1. Click **Start** in Node.js Selector
2. Check logs for any errors
3. Verify the app is running

### Step 5: Configure Static File Serving

Ensure your Node.js app serves static files from `uploads/`:
- The app already has: `app.use('/uploads', express.static('uploads'))`
- Make sure `uploads/` directory exists and is writable

---

## File Permissions

Set proper file permissions via cPanel File Manager or SSH:

```bash
# Backend directory
chmod 755 ~/public_html/api
chmod 644 ~/public_html/api/.env
chmod 755 ~/public_html/api/dist
chmod 755 ~/public_html/api/uploads

# Frontend directory
chmod 755 ~/public_html
chmod 644 ~/public_html/index.html
chmod 755 ~/public_html/assets

# Uploads directory (must be writable)
chmod 755 ~/public_html/api/uploads
chmod 755 ~/public_html/api/uploads/products
chmod 755 ~/public_html/api/uploads/social
```

---

## Domain/Subdomain Configuration

### Option 1: Main Domain + API Subdomain (Recommended)

**Frontend:** `https://yourdomain.com`
- Upload frontend files to `public_html/`

**Backend:** `https://api.yourdomain.com`
- Create subdomain in cPanel
- Point to `public_html/api`
- Configure Node.js app for this subdomain

### Option 2: Subdomain for App

**Frontend:** `https://app.yourdomain.com`
- Create subdomain in cPanel
- Point to `public_html/app`
- Upload frontend files there

**Backend:** `https://api.yourdomain.com`
- Same as Option 1

### Option 3: Single Domain with Path

**Frontend:** `https://yourdomain.com`
- Upload to `public_html/`

**Backend:** `https://yourdomain.com/api`
- Requires reverse proxy configuration
- More complex setup

---

## Testing & Verification

### Step 1: Test Backend API

1. Check health endpoint:
   ```
   https://api.yourdomain.com/health
   ```
   Should return: `{"success":true,"message":"Server is running"}`

2. Test database connection:
   - Try logging in via frontend
   - Check server logs for errors

### Step 2: Test Frontend

1. Open `https://yourdomain.com`
2. Check browser console for errors
3. Verify API calls are going to correct backend URL
4. Test login functionality

### Step 3: Test File Uploads

1. Upload a file (e.g., product image)
2. Verify file is saved in `api/uploads/`
3. Check file is accessible via URL

### Step 4: Test Database Operations

1. Create a test record
2. Verify it's saved in database
3. Check multi-tenancy (companyId filtering)

---

## Troubleshooting

### Backend Not Starting

**Check:**
- Node.js version (must be 18+)
- Environment variables are set correctly
- Port is not in use
- Database connection string is correct
- Prisma client is generated: `npx prisma generate`

**View Logs:**
- Check cPanel Node.js app logs
- Check error logs in cPanel

### Frontend Not Loading

**Check:**
- `index.html` is in root directory
- Assets are uploaded correctly
- `.htaccess` is configured (for React Router)
- API URL in frontend matches backend URL
- CORS is configured correctly in backend

### Database Connection Errors

**Check:**
- Database credentials are correct
- Database host (usually `localhost`)
- Database user has proper permissions
- Database exists
- Prisma migrations are run

### CORS Errors

**Fix:**
- Update `CLIENT_URL` in backend `.env`
- Update CORS middleware in `server/src/app.ts`
- Ensure frontend URL matches `CLIENT_URL`

### File Upload Issues

**Check:**
- `uploads/` directory exists
- Directory permissions (755)
- File size limits
- Multer configuration

### 404 Errors on Frontend Routes

**Fix:**
- Ensure `.htaccess` is configured
- Check Apache mod_rewrite is enabled
- Verify React Router configuration

---

## Additional Configuration

### SSL Certificate

1. Install SSL certificate via cPanel (Let's Encrypt)
2. Force HTTPS redirect in `.htaccess`:

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### Cron Jobs (if needed)

Set up cron jobs in cPanel for:
- Database backups
- Scheduled tasks
- Cleanup jobs

### Email Configuration

Configure email settings if your app sends emails:
- SMTP settings in environment variables
- Email service provider credentials

---

## Post-Deployment Checklist

- [ ] Backend API is running and accessible
- [ ] Frontend is loading correctly
- [ ] Database connection is working
- [ ] User registration/login works
- [ ] File uploads are working
- [ ] API endpoints are responding
- [ ] CORS is configured correctly
- [ ] SSL certificate is installed
- [ ] Environment variables are set
- [ ] File permissions are correct
- [ ] Error logs are being monitored
- [ ] Backups are configured

---

## Support & Resources

- **Prisma Docs:** https://www.prisma.io/docs
- **cPanel Node.js Guide:** Check your hosting provider's documentation
- **React Router Deployment:** https://reactrouter.com/en/main/start/overview

---

## Notes

1. **Performance:** Consider using a CDN for frontend assets
2. **Security:** Regularly update dependencies and monitor security advisories
3. **Backups:** Set up automated database backups
4. **Monitoring:** Use cPanel logs and external monitoring tools
5. **Updates:** Test updates in staging before deploying to production

---

**Last Updated:** 2024
**Version:** 1.0

