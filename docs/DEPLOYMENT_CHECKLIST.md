# Quick Deployment Checklist for cPanel

Use this checklist when deploying Omni CRM to cPanel.

## Pre-Deployment

- [ ] Build frontend: `cd client && npm run build`
- [ ] Build backend: `cd server && npm run build`
- [ ] Test builds locally
- [ ] Prepare environment variables
- [ ] Backup existing database (if updating)

## Database Setup

- [ ] Create MySQL database in cPanel
- [ ] Create database user
- [ ] Grant all privileges to user
- [ ] Note database credentials

## Backend Deployment

- [ ] Upload `server/dist/` to `api/dist/`
- [ ] Upload `server/prisma/` to `api/prisma/`
- [ ] Upload `server/package.json` to `api/`
- [ ] Create `api/.env` with all variables
- [ ] Install dependencies: `npm install --production`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Create `api/uploads/` directory
- [ ] Set uploads permissions: `chmod 755 api/uploads`

## Frontend Deployment

- [ ] Upload contents of `client/dist/` to domain root
- [ ] Create `.htaccess` for React Router
- [ ] Verify `index.html` is in root
- [ ] Check assets folder is uploaded

## Node.js Configuration

- [ ] Create Node.js app in cPanel
- [ ] Set Node.js version (18+)
- [ ] Set application root: `public_html/api`
- [ ] Set startup file: `dist/server.js`
- [ ] Set environment variables
- [ ] Start application
- [ ] Check application logs

## Environment Variables

### Backend (`api/.env`)
- [ ] `NODE_ENV=production`
- [ ] `PORT=5001` (or cPanel assigned port)
- [ ] `DATABASE_URL=mysql://user:pass@localhost:3306/dbname`
- [ ] `JWT_SECRET=strong_random_secret`
- [ ] `CLIENT_URL=https://yourdomain.com`
- [ ] `API_URL=https://api.yourdomain.com`

### Frontend (before build)
- [ ] `VITE_API_URL=https://api.yourdomain.com/api`

## Domain/Subdomain

- [ ] Create subdomain for API (e.g., `api.yourdomain.com`)
- [ ] Point subdomain to `public_html/api`
- [ ] Configure Node.js app for subdomain
- [ ] Set up SSL certificate

## File Permissions

- [ ] `api/` directory: 755
- [ ] `api/.env`: 600 (secure)
- [ ] `api/uploads/`: 755
- [ ] Frontend root: 755
- [ ] `index.html`: 644

## Testing

- [ ] Backend health check: `https://api.yourdomain.com/health`
- [ ] Frontend loads: `https://yourdomain.com`
- [ ] Login/Registration works
- [ ] API calls succeed (check browser console)
- [ ] File uploads work
- [ ] Database operations work
- [ ] No CORS errors
- [ ] SSL certificate active

## Post-Deployment

- [ ] Monitor error logs
- [ ] Test all major features
- [ ] Set up database backups
- [ ] Configure cron jobs (if needed)
- [ ] Update DNS if needed
- [ ] Test on mobile devices

## Quick Commands Reference

```bash
# Build frontend
cd client && npm run build

# Build backend
cd server && npm run build

# On server - Install dependencies
cd ~/public_html/api && npm install --production

# On server - Generate Prisma client
cd ~/public_html/api && npx prisma generate

# On server - Run migrations
cd ~/public_html/api && npx prisma migrate deploy

# Check Node.js app status (in cPanel)
# Use Node.js Selector interface
```

## Common Issues

- **Backend not starting:** Check Node.js version, env vars, port
- **Frontend 404:** Check `.htaccess`, mod_rewrite enabled
- **CORS errors:** Update `CLIENT_URL` in backend `.env`
- **Database errors:** Verify credentials, run migrations
- **File upload fails:** Check directory permissions (755)

---

**Quick Tip:** Keep this checklist handy during deployment!


