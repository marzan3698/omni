# Quick Start: Deploy Omni CRM to cPanel

This is a condensed guide for experienced developers. For detailed instructions, see `CPANEL_DEPLOYMENT_GUIDE.md`.

## 🚀 Quick Steps

### 1. Build Locally

```bash
# Build frontend
cd client
npm install
npm run build

# Build backend
cd ../server
npm install
npm run build
```

### 2. Prepare Environment Variables

**Frontend** (`client/.env.production`):
```env
VITE_API_URL=https://api.yourdomain.com/api
```

**Backend** (`server/.env` - will be `api/.env` on server):
```env
NODE_ENV=production
PORT=5001
DATABASE_URL=mysql://user:pass@localhost:3306/dbname
JWT_SECRET=your_strong_secret_min_32_chars
CLIENT_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com
```

### 3. Upload Files

**Backend:**
- Upload `server/dist/` → `public_html/api/dist/`
- Upload `server/prisma/` → `public_html/api/prisma/`
- Upload `server/package.json` → `public_html/api/`
- Create `public_html/api/.env` with your variables

**Frontend:**
- Upload **contents** of `client/dist/` → `public_html/` (or subdomain root)
- Upload `.htaccess` from `docs/.htaccess.example` → `public_html/.htaccess`

### 4. Setup Database

1. Create MySQL database in cPanel
2. Create database user and grant privileges
3. Update `DATABASE_URL` in `api/.env`

### 5. Install & Configure Backend

**Via SSH or cPanel Terminal:**
```bash
cd ~/public_html/api
npm install --production
npx prisma generate
npx prisma migrate deploy
mkdir -p uploads/products uploads/social
chmod 755 uploads
```

### 6. Configure Node.js in cPanel

1. Go to **Node.js Selector** in cPanel
2. Create new application:
   - **Application Root:** `public_html/api`
   - **Application URL:** `api.yourdomain.com` (create subdomain first)
   - **Startup File:** `dist/server.js`
   - **Node Version:** 18+
3. Add environment variables
4. Click **Start**

### 7. Test

- Backend: `https://api.yourdomain.com/health`
- Frontend: `https://yourdomain.com`
- Login and test functionality

## 📋 File Structure on Server

```
public_html/
├── api/                    # Backend
│   ├── dist/
│   ├── prisma/
│   ├── uploads/
│   ├── node_modules/
│   ├── package.json
│   └── .env
│
└── [root]/                 # Frontend
    ├── index.html
    ├── assets/
    └── .htaccess
```

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| Backend won't start | Check Node.js version (18+), env vars, port |
| Frontend 404 on routes | Add `.htaccess` with React Router config |
| CORS errors | Update `CLIENT_URL` in backend `.env` |
| Database errors | Verify credentials, run `npx prisma migrate deploy` |
| File upload fails | Check `uploads/` permissions (755) |

## 📚 Full Documentation

- **Complete Guide:** `CPANEL_DEPLOYMENT_GUIDE.md`
- **Checklist:** `DEPLOYMENT_CHECKLIST.md`
- **Config Examples:** `server.env.example`, `client.env.example`, `.htaccess.example`

## ✅ Post-Deployment

- [ ] Test all features
- [ ] Install SSL certificate
- [ ] Set up database backups
- [ ] Monitor error logs
- [ ] Test on mobile devices

---

**Need Help?** Refer to the detailed guide: `CPANEL_DEPLOYMENT_GUIDE.md`


