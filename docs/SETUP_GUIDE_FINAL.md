# Complete Setup Guide - Choose Your Deployment Method

## Current Situation

- ✅ GitHub repository connected
- ✅ SSH keys configured
- ✅ GitHub Secrets added
- ❌ **Node.js not found on server** (for building)

---

## 🎯 Solution: Choose One Method

### **Option 1: Build on GitHub Actions (RECOMMENDED - Easier)**

Build everything on GitHub Actions (which has Node.js), then upload only built files to your server.

**✅ Advantages:**
- No need to find/configure Node.js on your server
- Faster builds (GitHub Actions has better resources)
- More reliable (doesn't depend on server Node.js availability)

**How to use:**
1. I've created a new workflow: `.github/workflows/deploy-build-on-github.yml`
2. Rename it to replace the current `deploy.yml`

**Steps:**
```bash
# On your local machine:
cd /Applications/XAMPP/xamppfiles/htdocs/omni
git mv .github/workflows/deploy.yml .github/workflows/deploy-old.yml
git mv .github/workflows/deploy-build-on-github.yml .github/workflows/deploy.yml
git commit -m "Switch to build-on-GitHub deployment method"
git push origin main
```

This will build on GitHub Actions and deploy only built files!

---

### **Option 2: Build on Server (Current Method)**

Find Node.js on your server and configure the deployment script to use it.

**Steps:**

1. **Find Node.js on your server:**

   In cPanel Terminal, run:
   ```bash
   # Try to find Node.js
   find /usr/local -name "node" -type f 2>/dev/null
   find /opt -name "node" -type f 2>/dev/null
   find ~ -name "node" -type f 2>/dev/null
   
   # Check cPanel Node.js directories
   ls -la ~/.cpanel-nodejs-selector/nodejs-bin/*/bin/node 2>/dev/null
   ```

   **Share the output** - I'll update the deployment script with the correct path.

2. **Update deployment script** with the Node.js path (I'll do this after you share the output)

3. **Test deployment**

---

## 📋 Step-by-Step: Option 1 (Recommended)

### Step 1: Switch to Build-on-GitHub Workflow

Run these commands on your local machine:

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/omni

# Backup current workflow
git mv .github/workflows/deploy.yml .github/workflows/deploy-old.yml

# Use the new build-on-GitHub workflow
git mv .github/workflows/deploy-build-on-github.yml .github/workflows/deploy.yml

# Commit and push
git add .github/workflows/
git commit -m "Switch to build-on-GitHub deployment (no Node.js needed on server)"
git push origin main
```

### Step 2: Monitor Deployment

After pushing:
1. Go to GitHub Actions: `https://github.com/marzan3698/omni/actions`
2. Watch the workflow run
3. It should complete successfully!

### Step 3: Verify Deployment

After successful deployment:

**Frontend:**
- Visit: `https://paaera.com`
- Should see your React app

**Backend:**
- You'll need to set up the Node.js app in cPanel (see below)

---

## 📋 Step-by-Step: Set Up Node.js App in cPanel (For Backend API)

**This is required for running your backend API** (separate from building):

### Step 1: Create Node.js Application in cPanel

1. Go to cPanel → **Node.js Selector** → **+ CREATE APPLICATION**

2. Fill in the form:
   - **Node.js version:** Select **20.17.0** (or the latest available)
   - **Application mode:** `production`
   - **Application root:** `/home/paaera/api`
   - **Application URL:** Choose:
     - `paaera.com` (main domain)
     - OR create subdomain: `api.paaera.com`
   - **Application startup file:** `dist/server.js`
   - Click **CREATE**

### Step 2: Configure Environment Variables

After creating the app, click the **pencil icon** to edit:

1. Click **Environment Variables** section
2. Click **+ ADD VARIABLE** for each:

   ```
   NODE_ENV=production
   PORT=5001
   DATABASE_URL=mysql://username:password@localhost:3306/database_name
   JWT_SECRET=your_jwt_secret_here_min_32_chars
   CLIENT_URL=https://paaera.com
   API_URL=https://paaera.com/api
   ```

3. Click **SAVE**

### Step 3: Start the Application

1. In Node.js Selector, find your app
2. Click **Start** button (green play icon)
3. Wait for it to start (status should show "started")

---

## 🔄 Complete Deployment Flow

### After Setup is Complete:

**When you push code to GitHub:**
1. ✅ GitHub Actions automatically triggers
2. ✅ Builds frontend (React/Vite)
3. ✅ Builds backend (TypeScript/Express)
4. ✅ Uploads built files to cPanel server
5. ✅ Deploys frontend to `~/public_html`
6. ✅ Deploys backend to `~/api`
7. ✅ Frontend is live at `https://paaera.com`
8. ✅ Backend runs via Node.js app in cPanel

**You need to restart the Node.js app** in cPanel after backend deployment:
- Go to Node.js Selector
- Click **Restart** button on your app

---

## 🎯 Recommended Next Steps

**I recommend Option 1** (build on GitHub Actions):

1. Run the commands from "Step 1: Switch to Build-on-GitHub Workflow" above
2. Push to GitHub
3. Watch it deploy automatically
4. Set up Node.js app in cPanel for backend
5. Done! ✅

---

## ❓ Need Help?

**If you want to proceed with Option 1:**
- Just run the commands above
- Push to GitHub
- It will work!

**If you prefer Option 2:**
- Share the output of the `find` commands from your cPanel Terminal
- I'll update the deployment script with the correct Node.js path

---

**Which option do you want to use?**
1. **Option 1** (Build on GitHub - Recommended) - Just run the commands
2. **Option 2** (Build on Server) - Share the Node.js path output
