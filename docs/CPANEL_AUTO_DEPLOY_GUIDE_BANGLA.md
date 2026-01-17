# GitHub থেকে cPanel Auto Deployment গাইড (বাংলা)

## 📋 Overview

এই guide আপনাকে GitHub থেকে cPanel-এ automatic deployment setup করতে সাহায্য করবে। প্রতিবার আপনি local-এ code push করলে, cPanel-এ automatically update হবে।

**Simple Approach**: cPanel-এর built-in Git Version Control ব্যবহার করা হবে।

---

## 🎯 Prerequisites

- ✅ cPanel access
- ✅ SSH/Terminal access in cPanel
- ✅ Node.js support in cPanel (Node.js Selector available)
- ✅ GitHub repository: `https://github.com/marzan3698/omni.git`
- ✅ MySQL database already set up

---

## 📝 Step-by-Step Guide

### Step 1: GitHub Repository Verification ✅

**Task**: আপনার local repository GitHub-এর সাথে connected আছে কিনা verify করুন।

**আপনাকে যা করতে হবে:**

1. Terminal/Command Prompt খুলুন
2. এই command run করুন:
   ```bash
   cd /Applications/XAMPP/xamppfiles/htdocs/omni
   git remote -v
   ```

**Expected Output:**
```
origin  https://github.com/marzan3698/omni.git (fetch)
origin  https://github.com/marzan3698/omni.git (push)
```

**Verification:**
- ✅ যদি এই output দেখেন, তাহলে GitHub connected আছে
- ❌ যদি কোনো output না দেখেন, তাহলে GitHub-এ repository create করতে হবে

**Confirmation দিন**: "GitHub repository verified" অথবা screenshot দিন

---

### Step 2: cPanel Git Version Control Setup

**Task**: cPanel-এ Git Version Control feature ব্যবহার করে repository clone করুন।

**আপনাকে যা করতে হবে:**

1. **cPanel-এ login করুন**
2. Search bar-এ **"Git"** বা **"Version Control"** search করুন
3. **"Git Version Control"** icon-এ click করুন
4. **"Create"** button click করুন
5. Form fill করুন:
   - **Repository Root**: `/home/username/omni` (অথবা আপনার পছন্দমতো path)
   - **Repository Name**: `omni` (অথবা আপনার পছন্দমতো name)
   - **Clone a Repository**: ✅ Check করুন
   - **Repository URL**: `https://github.com/marzan3698/omni.git`
   - **Repository Branch**: `main`
   - **Automatic Deployment**: ✅ Check করুন (যদি option থাকে)
6. **Create** button click করুন

**Verification:**
- Repository successfully cloned হওয়া উচিত
- Files দেখতে পাবেন

**Confirmation দিন**: "Git repository cloned in cPanel" অথবা screenshot দিন

---

### Step 3: Deployment Script Setup

**Task**: `deploy-cpanel.sh` script cPanel-এ upload করুন এবং executable permission দিন।

**আপনাকে যা করতে হবে:**

1. **cPanel File Manager** খুলুন
2. Git repository folder-এ যান (যেমন: `/home/username/omni`)
3. `deploy-cpanel.sh` file upload করুন (root directory-এ)
4. File-এ **right-click** করুন → **"Change Permissions"**
5. **Execute** permission দিন: `755` (Owner: Read, Write, Execute | Group: Read, Execute | Public: Read, Execute)
6. **Change Permissions** button click করুন

**Verification:**
- File permissions: `755` হওয়া উচিত
- File executable হওয়া উচিত

**Confirmation দিন**: "Deployment script uploaded and executable" অথবা screenshot দিন

---

### Step 4: Post-Receive Hook Setup

**Task**: Git repository-তে post-receive hook file তৈরি করুন যা automatically deployment script run করবে।

**আপনাকে যা করতে হবে:**

1. **cPanel Terminal** (SSH) খুলুন
2. Git repository directory-এ যান:
   ```bash
   cd ~/omni
   ```
3. `.git/hooks` folder-এ যান:
   ```bash
   cd .git/hooks
   ```
4. `post-receive` file তৈরি করুন:
   ```bash
   nano post-receive
   ```
5. এই content paste করুন:
   ```bash
   #!/bin/bash
   cd ~/omni
   bash deploy-cpanel.sh
   ```
6. **Save করুন**: `Ctrl+O`, `Enter`, `Ctrl+X`
7. Executable permission দিন:
   ```bash
   chmod +x post-receive
   ```

**Verification:**
- `post-receive` file তৈরি হয়েছে
- Executable permission আছে

**Confirmation দিন**: "Post-receive hook created" অথবা screenshot দিন

---

### Step 5: Environment Variables Setup

**Task**: cPanel-এ `.env` files create করুন (database, JWT secret, etc.)

**আপনাকে যা করতে হবে:**

1. **cPanel File Manager** খুলুন
2. `server` folder-এ যান
3. `.env` file create করুন (যদি না থাকে)
4. এই content add করুন (আপনার actual values দিয়ে replace করুন):
   ```env
   # Database
   DATABASE_URL="mysql://username:password@localhost:3306/database_name"
   
   # JWT
   JWT_SECRET="your-secret-key-here"
   
   # Server
   PORT=5001
   NODE_ENV=production
   
   # Client URL
   CLIENT_URL="https://yourdomain.com"
   API_URL="https://api.yourdomain.com"
   
   # CORS
   CORS_ORIGIN="https://yourdomain.com"
   ```

**Important**: 
- Database credentials আপনার cPanel MySQL database-এর সাথে match করতে হবে
- JWT_SECRET একটি strong random string হতে হবে

**Confirmation দিন**: ".env file created with correct values" অথবা screenshot দিন

---

### Step 6: Node.js Application Configuration

**Task**: cPanel Node.js Selector-এ application create করুন।

**আপনাকে যা করতে হবে:**

1. **cPanel-এ** **"Node.js Selector"** খুলুন
2. **"Create Application"** button click করুন
3. Form fill করুন:
   - **Node.js Version**: `20.x` (অথবা আপনার compatible version)
   - **Application Mode**: `Production`
   - **Application Root**: `/home/username/omni/server` (server folder path)
   - **Application URL**: `api.yourdomain.com` (অথবা subdomain)
   - **Application Startup File**: `dist/server.js`
   - **Passenger Log File**: (optional, auto-generated)
4. **Create** button click করুন
5. Application **Start** করুন

**Verification:**
- Application status: **Running** হওয়া উচিত
- Logs check করুন errors আছে কিনা

**Confirmation দিন**: "Node.js application created and running" অথবা screenshot দিন

---

### Step 7: Test Deployment

**Task**: একটি test change commit এবং push করুন, তারপর cPanel-এ automatic deployment verify করুন。

**আপনাকে যা করতে হবে:**

1. **Local terminal**-এ:
   ```bash
   cd /Applications/XAMPP/xamppfiles/htdocs/omni
   # একটি small change করুন (যেমন: README.md-এ একটি line add করুন)
   echo "# Test deployment" >> README.md
   git add .
   git commit -m "Test: Auto deployment"
   git push origin main
   ```

2. **cPanel Terminal**-এ deployment logs check করুন:
   ```bash
   cd ~/omni
   # Check if deployment script ran
   tail -f deploy-cpanel.log  # (যদি log file থাকে)
   ```

3. **cPanel File Manager**-এ verify করুন:
   - `client/dist` folder updated হয়েছে
   - `server/dist` folder updated হয়েছে

4. **Application test করুন**:
   - Frontend URL visit করুন
   - Backend API test করুন

**Verification:**
- ✅ Code automatically pulled হয়েছে
- ✅ Build completed হয়েছে
- ✅ Application running আছে

**Confirmation দিন**: "Test deployment successful" অথবা screenshot দিন

---

## 🔧 Troubleshooting

### Problem 1: Git Hook Not Running

**Solution:**
- Hook file executable permission check করুন
- Hook file path correct আছে কিনা verify করুন
- cPanel Git Version Control settings check করুন

### Problem 2: Build Fails

**Solution:**
- Node.js version compatibility check করুন
- Dependencies install হয়েছে কিনা verify করুন
- Check logs for specific errors

### Problem 3: Application Not Restarting

**Solution:**
- cPanel Node.js Selector-এ manually restart করুন
- Application logs check করুন
- Port conflicts check করুন

### Problem 4: Environment Variables Not Loading

**Solution:**
- `.env` file path correct আছে কিনা verify করুন
- File permissions check করুন
- Environment variables properly formatted আছে কিনা check করুন

---

## 📋 Quick Checklist

- [ ] Step 1: GitHub repository verified
- [ ] Step 2: cPanel Git repository cloned
- [ ] Step 3: Deployment script uploaded and executable
- [ ] Step 4: Post-receive hook created
- [ ] Step 5: Environment variables configured
- [ ] Step 6: Node.js application created and running
- [ ] Step 7: Test deployment successful

---

## 🎉 Success!

এখন আপনি local-এ code push করলে automatically cPanel-এ deploy হবে!

**Next Steps:**
- Regular development workflow continue করুন
- Monitor deployment logs
- Keep environment variables updated

---

**Last Updated**: 2024
