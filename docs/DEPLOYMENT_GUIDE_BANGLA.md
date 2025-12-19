# Omni CRM সার্ভার Deployment গাইড (বাংলা)

এই গাইডে Omni CRM application সার্ভারে deploy করার সম্পূর্ণ প্রক্রিয়া বর্ণনা করা হয়েছে। এই গাইড অনুসরণ করে আপনি যেকোনো নতুন সার্ভারে application deploy করতে পারবেন।

---

## 📋 Table of Contents

1. [সার্ভার Requirements](#সার্ভার-requirements)
2. [SSH Connection](#ssh-connection)
3. [System Update](#system-update)
4. [Node.js Installation](#nodejs-installation)
5. [MySQL Database Setup](#mysql-database-setup)
6. [PM2 Installation](#pm2-installation)
7. [Nginx Installation](#nginx-installation)
8. [Project Deployment](#project-deployment)
9. [Environment Variables](#environment-variables)
10. [Build এবং Migration](#build-এবং-migration)
11. [PM2 Configuration](#pm2-configuration)
12. [Nginx Configuration](#nginx-configuration)
13. [Database Seeding](#database-seeding)
14. [Testing](#testing)
15. [Common Errors এবং Solutions](#common-errors-এবং-solutions)

---

## 🖥️ সার্ভার Requirements

- **OS**: AlmaLinux 9.x / Rocky Linux 9.x / RHEL 9.x (RHEL-based distributions)
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB
- **Node.js**: 18.x or higher
- **MySQL**: 8.0 or higher
- **Nginx**: Latest stable version

---

## 🔐 SSH Connection

### iTerm2 দিয়ে সার্ভারে Connect করা

1. iTerm2 খুলুন
2. `Command + T` (নতুন tab) অথবা `Command + N` (নতুন window)
3. Terminal-এ এই command টাইপ করুন:

```bash
ssh root@YOUR_SERVER_IP
```

4. Password prompt এ password দিন
5. Enter চাপুন

**সফল হলে prompt দেখাবে:**
```
[root@server1 ~]#
```

---

## 🔄 System Update

সার্ভারে login হওয়ার পর প্রথমে system update করুন:

```bash
apt update && apt upgrade -y
```

**Note**: AlmaLinux/RHEL-based systems এ `apt` নয়, `dnf` ব্যবহার করতে হবে:

```bash
dnf update -y
```

**সময়**: ২-৫ মিনিট লাগতে পারে

---

## 📦 প্রয়োজনীয় Tools Install করা

```bash
dnf install -y curl wget git gcc gcc-c++ make tar
```

**ব্যাখ্যা:**
- `curl`, `wget` - File download করার জন্য
- `git` - GitHub থেকে code clone করার জন্য
- `gcc`, `gcc-c++`, `make` - Node.js build করার জন্য
- `tar` - Archive extract করার জন্য

---

## 🔥 Firewall Setup

```bash
# UFW install করুন (যদি না থাকে)
dnf install -y firewalld
systemctl start firewalld
systemctl enable firewalld

# প্রয়োজনীয় ports allow করুন
firewall-cmd --permanent --add-service=ssh
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

# Status check করুন
firewall-cmd --list-all
```

---

## 📦 Node.js Installation (NVM দিয়ে)

### Step 1: NVM Install করুন

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

### Step 2: Shell Reload করুন

```bash
source ~/.bashrc
```

### Step 3: Node.js 18 Install করুন

```bash
nvm install 18
nvm use 18
nvm alias default 18
```

### Step 4: System-wide Access (Optional)

```bash
ln -sf ~/.nvm/versions/node/$(nvm version 18)/bin/node /usr/local/bin/node
ln -sf ~/.nvm/versions/node/$(nvm version 18)/bin/npm /usr/local/bin/npm
```

### Step 5: Verify করুন

```bash
node --version
npm --version
```

**আশা করা হচ্ছে:**
- Node.js: `v18.x.x`
- npm: `9.x.x` বা তার বেশি

---

## 🗄️ MySQL Database Setup

### Step 1: MySQL Install করুন

```bash
dnf install -y mysql-server mysql
```

### Step 2: MySQL Service Start করুন

```bash
systemctl start mysqld
systemctl enable mysqld
```

### Step 3: MySQL Secure Installation (Optional)

```bash
mysql_secure_installation
```

**Prompts:**
- Validate password plugin: `N`
- New password: একটি শক্ত password দিন (নোট করুন)
- Remove anonymous users: `Y`
- Disallow root login remotely: `Y`
- Remove test database: `Y`
- Reload privilege tables: `Y`

### Step 4: Database এবং User তৈরি করুন

```bash
mysql -u root -p
```

MySQL prompt এ এই commands run করুন:

```sql
CREATE DATABASE omni_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'omni_user'@'localhost' IDENTIFIED BY 'আপনার_শক্ত_পাসওয়ার্ড_এখানে';
GRANT ALL PRIVILEGES ON omni_crm.* TO 'omni_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**গুরুত্বপূর্ণ**: Database password নোট করুন, পরে `.env` file-এ লাগবে।

---

## ⚙️ PM2 Installation

### Step 1: PM2 Install করুন

```bash
npm install -g pm2
```

### Step 2: PM2 Startup Setup

```bash
pm2 startup systemd
```

একটি command দেখাবে, সেটা copy করে run করুন (যেমন):
```bash
sudo env PATH=$PATH:/root/.nvm/versions/node/v18.x.x/bin pm2 startup systemd -u root --hp /root
```

### Step 3: Log Directory তৈরি করুন

```bash
mkdir -p /var/log/pm2
```

---

## 🌐 Nginx Installation

```bash
dnf install -y nginx
systemctl start nginx
systemctl enable nginx
systemctl status nginx
```

---

## 📁 Project Directory তৈরি করা

```bash
mkdir -p /var/www/omni
mkdir -p /var/backups/omni/database
cd /var/www/omni
```

---

## 📥 GitHub থেকে Code Clone করা

### Option 1: Private Repository (SSH Key দিয়ে)

#### Step 1: SSH Key Generate করুন

```bash
ssh-keygen -t ed25519 -C "omni-deploy" -f ~/.ssh/github_deploy -N ""
```

#### Step 2: Public Key দেখুন

```bash
cat ~/.ssh/github_deploy.pub
```

#### Step 3: GitHub-এ Deploy Key Add করুন

1. Browser-এ যান: `https://github.com/YOUR_USERNAME/omni/settings/keys`
2. "Add deploy key" ক্লিক করুন
3. Title: `Server Deploy Key`
4. Key: Public key paste করুন
5. "Allow write access" check করুন
6. "Add key" ক্লিক করুন

#### Step 4: Repository Clone করুন

```bash
cd /var/www/omni
GIT_SSH_COMMAND="ssh -i ~/.ssh/github_deploy -o IdentitiesOnly=yes" git clone git@github.com:YOUR_USERNAME/omni.git .
```

**প্রথমবার "yes" টাইপ করুন** GitHub host key accept করার জন্য।

### Option 2: Public Repository

```bash
cd /var/www/omni
git clone https://github.com/YOUR_USERNAME/omni.git .
```

---

## 🔧 Environment Variables Setup

### Server .env File

```bash
cd /var/www/omni/server
nano .env
```

এই content paste করুন (values পরিবর্তন করুন):

```env
NODE_ENV=production
PORT=5001
DATABASE_URL=mysql://omni_user:আপনার_ডাটাবেস_পাসওয়ার্ড@localhost:3306/omni_crm
JWT_SECRET=একটি-শক্ত-এবং-র্যান্ডম-স্ট্রিং-কমপক্ষে-৩২-ক্যারেক্টার
JWT_EXPIRES_IN=7d
CLIENT_URL=http://YOUR_SERVER_IP
API_URL=http://YOUR_SERVER_IP:5001
FACEBOOK_VERIFY_TOKEN=your_facebook_verify_token
FACEBOOK_APP_ID=your_facebook_app_id
CHATWOOT_WEBHOOK_URL=http://YOUR_SERVER_IP:5001/api/chatwoot/webhooks/chatwoot
```

**গুরুত্বপূর্ণ:**
- `DATABASE_URL`-এ `আপনার_ডাটাবেস_পাসওয়ার্ড` পরিবর্তন করুন
- `JWT_SECRET` একটি শক্ত random string দিন (কমপক্ষে ৩২ characters)
- `YOUR_SERVER_IP` পরিবর্তন করুন আপনার সার্ভার IP দিয়ে

**Save**: `Ctrl + O`, Enter, `Ctrl + X`

### Client .env File

```bash
cd /var/www/omni/client
nano .env
```

এই content paste করুন:

```env
VITE_API_URL=http://YOUR_SERVER_IP:5001/api
```

**Save**: `Ctrl + O`, Enter, `Ctrl + X`

---

## 🔨 Build এবং Migration

### Step 1: Dependencies Install করুন

```bash
# Server dependencies
cd /var/www/omni/server
npm install

# Client dependencies
cd /var/www/omni/client
npm install
```

### Step 2: Missing Packages Install করুন

```bash
cd /var/www/omni/server
npm install pdfkit @types/pdfkit
```

### Step 3: TypeScript Config Fix করুন

```bash
cd /var/www/omni/server
nano tsconfig.json
```

এই content দিয়ে replace করুন:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": false,
    "noFallthroughCasesInSwitch": false,
    "allowSyntheticDefaultImports": true,
    "noEmitOnError": false,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Save**: `Ctrl + O`, Enter, `Ctrl + X`

### Step 4: Client Build করুন

```bash
cd /var/www/omni/client
npx vite build
```

**Note**: Node.js version warning থাকতে পারে, কিন্তু build হবে।

### Step 5: Server Build করুন

```bash
cd /var/www/omni/server
npm run build
```

**Note**: TypeScript errors থাকতে পারে, কিন্তু `noEmitOnError: false` থাকায় files generate হবে।

### Step 6: Database Schema Push করুন

```bash
cd /var/www/omni/server
npx prisma generate
npx prisma db push
```

### Step 7: Uploads Directory তৈরি করুন

```bash
cd /var/www/omni/server
mkdir -p uploads/products uploads/social
chmod -R 755 uploads
```

---

## 🚀 PM2 Configuration

### Step 1: Ecosystem File তৈরি করুন

```bash
cd /var/www/omni/server
nano ecosystem.config.cjs
```

**গুরুত্বপূর্ণ**: File extension `.cjs` হতে হবে (CommonJS format)।

এই content paste করুন:

```javascript
module.exports = {
  apps: [
    {
      name: 'omni-crm',
      script: './dist/server.js',
      cwd: '/var/www/omni/server',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5001,
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/omni-crm-error.log',
      out_file: '/var/log/pm2/omni-crm-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};
```

**Save**: `Ctrl + O`, Enter, `Ctrl + X`

### Step 2: PM2 Start করুন

```bash
cd /var/www/omni/server
pm2 start ecosystem.config.cjs
pm2 save
pm2 status
```

**আশা করা হচ্ছে:**
- `omni-crm` status: `online`

---

## 🌐 Nginx Configuration

### Step 1: Config File তৈরি করুন

```bash
nano /etc/nginx/conf.d/omni.conf
```

এই content paste করুন (YOUR_SERVER_IP পরিবর্তন করুন):

```nginx
# Frontend (React App)
server {
    listen 80;
    server_name YOUR_SERVER_IP;

    root /var/www/omni/client/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Backend API (Reverse Proxy)
server {
    listen 80;
    server_name api.YOUR_SERVER_IP;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for large file uploads
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }

    # Increase client body size for file uploads (10MB)
    client_max_body_size 10M;
}
```

**Save**: `Ctrl + O`, Enter, `Ctrl + X`

### Step 2: Nginx Config Test করুন

```bash
nginx -t
```

**আশা করা হচ্ছে:**
- `syntax is ok`
- `test is successful`

### Step 3: Nginx Reload করুন

```bash
systemctl reload nginx
```

---

## 🌱 Database Seeding

Dummy data add করার জন্য:

```bash
cd /var/www/omni/server
npm run seed
```

**এই seed file যা তৈরি করবে:**
- Default Company: "Omni CRM"
- Roles: SuperAdmin, Admin, Manager, Sales, Employee, Finance Manager, Customer Care, Sales Manager, Lead Manager, HR Manager, Client
- Users:
  - **SuperAdmin**: `superadmin@omni.com` / `superadmin123`
  - **Admin**: `admin@omni.com` / `admin123`
  - **Manager**: `manager@omni.com` / `manager123`
  - **Sales**: `sales@omni.com` / `sales123`
  - **Lead Manager**: `leadmanager@omni.com` / `leadmanager123`
- Lead Categories: Hot Lead, Warm Lead, Cold Lead, Qualified, Not Qualified
- Lead Interests: Very Interested, Interested, Somewhat Interested, Not Interested, Follow Up Required

---

## ✅ Testing

### Step 1: Health Check

```bash
curl http://localhost:5001/health
```

**আশা করা হচ্ছে:**
```json
{"success":true,"message":"Server is running"}
```

### Step 2: Browser Test

Browser-এ এই URLs open করুন:

1. **Frontend**: `http://YOUR_SERVER_IP`
   - React application load হওয়া উচিত

2. **Backend API**: `http://YOUR_SERVER_IP:5001/health`
   - Health check response দেখাবে

### Step 3: Login Test

1. Browser-এ `http://YOUR_SERVER_IP` open করুন
2. Login page-এ যান
3. SuperAdmin credentials দিয়ে login করুন:
   - Email: `superadmin@omni.com`
   - Password: `superadmin123`

---

## ❌ Common Errors এবং Solutions

### Error 1: `apt: command not found`

**সমস্যা**: Debian/Ubuntu command ব্যবহার করা হয়েছে, কিন্তু সার্ভার RHEL-based।

**সমাধান**: `apt` এর পরিবর্তে `dnf` ব্যবহার করুন।

```bash
# Wrong
apt update

# Correct
dnf update -y
```

---

### Error 2: `tar: command not found`

**সমস্যা**: `tar` package install নেই।

**সমাধান**:
```bash
dnf install -y tar
```

---

### Error 3: `nano: command not found`

**সমস্যা**: `nano` editor install নেই।

**সমাধান**:
```bash
dnf install -y nano
```

---

### Error 4: TypeScript Build Errors

**সমস্যা**: TypeScript strict mode errors build block করছে।

**সমাধান**: `tsconfig.json`-এ এই settings করুন:

```json
{
  "compilerOptions": {
    "strict": false,
    "noEmitOnError": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": false
  }
}
```

---

### Error 5: `vite: command not found`

**সমস্যা**: Vite locally install করা আছে, globally নয়।

**সমাধান**: `npx` ব্যবহার করুন:

```bash
# Wrong
vite build

# Correct
npx vite build
```

---

### Error 6: PM2 `ERR_REQUIRE_ESM`

**সমস্যা**: `package.json`-এ `"type": "module"` আছে, কিন্তু PM2 CommonJS format চায়।

**সমাধান**: Ecosystem file-এর extension `.cjs` করুন:

```bash
# Wrong
ecosystem.config.js

# Correct
ecosystem.config.cjs
```

---

### Error 7: `Cannot find module 'pdfkit'`

**সমস্যা**: `pdfkit` package install নেই।

**সমাধান**:
```bash
cd /var/www/omni/server
npm install pdfkit @types/pdfkit
```

---

### Error 8: MySQL Connection Error

**সমস্যা**: Database connection fail হচ্ছে।

**সমাধান**:
1. `.env` file-এ `DATABASE_URL` check করুন
2. MySQL service running আছে কিনা check করুন:
   ```bash
   systemctl status mysqld
   ```
3. Database এবং user create হয়েছে কিনা verify করুন:
   ```bash
   mysql -u omni_user -p omni_crm
   ```

---

### Error 9: Port Already in Use

**সমস্যা**: Port 5001 already in use।

**সমাধান**:
1. `.env` file-এ `PORT` পরিবর্তন করুন
2. PM2 restart করুন:
   ```bash
   pm2 restart omni-crm
   ```

---

### Error 10: Nginx 502 Bad Gateway

**সমস্যা**: Nginx backend-এ connect করতে পারছে না।

**সমাধান**:
1. PM2 status check করুন:
   ```bash
   pm2 status
   ```
2. Application running আছে কিনা verify করুন:
   ```bash
   curl http://localhost:5001/health
   ```
3. Nginx config-এ `proxy_pass` URL check করুন (সঠিক port)

---

## 📝 Quick Reference Commands

### PM2 Commands

```bash
pm2 status              # Status দেখুন
pm2 logs omni-crm       # Logs দেখুন
pm2 restart omni-crm    # Restart করুন
pm2 stop omni-crm       # Stop করুন
pm2 delete omni-crm     # Delete করুন
pm2 monit               # Monitor করুন
pm2 save                # Configuration save করুন
```

### Nginx Commands

```bash
nginx -t                # Config test করুন
systemctl reload nginx  # Reload করুন
systemctl restart nginx # Restart করুন
systemctl status nginx  # Status দেখুন
```

### MySQL Commands

```bash
mysql -u omni_user -p omni_crm  # Database access
systemctl status mysqld          # MySQL status
systemctl restart mysqld         # MySQL restart
```

### Logs দেখার জন্য

```bash
# PM2 logs
pm2 logs omni-crm --lines 50

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# System logs
journalctl -u nginx -f
journalctl -u mysqld -f
```

---

## 🔄 Update Application

### Manual Update

```bash
cd /var/www/omni
git pull origin main
cd server && npm install && npm run build
cd ../client && npm install && npx vite build
cd ../server && npx prisma generate
pm2 restart omni-crm
systemctl reload nginx
```

### GitHub Actions Auto-Deployment

GitHub Actions workflow setup করতে হলে `.github/workflows/deploy.yml` file তৈরি করুন (আলাদা guide প্রয়োজন)।

---

## 🔒 Security Checklist

- [ ] Firewall configured (firewalld)
- [ ] Strong database password
- [ ] JWT_SECRET is strong and unique
- [ ] .env files not in git
- [ ] File permissions set correctly
- [ ] SSH key authentication (disable password auth recommended)
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Regular backups configured

---

## 📞 Support

### Troubleshooting Steps

1. **Application start হচ্ছে না:**
   ```bash
   pm2 logs omni-crm
   ```

2. **Database connection error:**
   - `.env` file-এ `DATABASE_URL` check করুন
   - MySQL running আছে কিনা: `systemctl status mysqld`

3. **Build fails:**
   - Node.js version: `node --version` (18.x হওয়া উচিত)
   - Dependencies: `npm install` আবার run করুন

4. **Nginx errors:**
   - Config test: `nginx -t`
   - Logs check: `tail -f /var/log/nginx/error.log`

---

## ✅ Deployment Checklist

- [ ] System updated
- [ ] Node.js 18 installed
- [ ] MySQL installed and configured
- [ ] PM2 installed and configured
- [ ] Nginx installed and configured
- [ ] Project cloned from GitHub
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Client built successfully
- [ ] Server built successfully
- [ ] Database schema pushed
- [ ] PM2 application running
- [ ] Nginx configured and reloaded
- [ ] Database seeded with dummy data
- [ ] Health check passed
- [ ] Browser test successful
- [ ] Login test successful

---

## 🎉 Success!

যদি সব steps সফলভাবে complete হয়, তাহলে আপনার Omni CRM application এখন live!

**Access URLs:**
- Frontend: `http://YOUR_SERVER_IP`
- Backend API: `http://YOUR_SERVER_IP:5001`

**Default Login Credentials:**
- SuperAdmin: `superadmin@omni.com` / `superadmin123`
- Admin: `admin@omni.com` / `admin123`

---

**Last Updated**: December 2025
**Version**: 1.0

