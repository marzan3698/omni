# Complete Automatic Deployment Setup Guide

## Current Status

✅ GitHub repository connected  
✅ SSH keys configured  
✅ GitHub Actions workflow created  
✅ Deployment script created  
❌ **Node.js path not found** - Need to locate Node.js on server  

---

## Step-by-Step Setup

### Step 1: Find Node.js on Your cPanel Server

We need to locate where Node.js is installed so the deployment script can use it.

**In your cPanel Terminal, run these commands:**

```bash
# Check for Node.js in common locations
find /usr/local -name "node" -type f 2>/dev/null | head -5
find /opt -name "node" -type f 2>/dev/null | head -5
find ~ -name "node" -type f 2>/dev/null | head -5

# Check cPanel Node.js Selector directory
ls -la ~/.cpanel-nodejs-selector/ 2>/dev/null
ls -la ~/.cpanel-nodejs-selector/nodejs-bin/ 2>/dev/null

# Check nodevenv directories
ls -la ~/nodevenv/*/node 2>/dev/null

# Try to find Node.js version manager
which nodejs 2>/dev/null || echo "nodejs not found"
which node 2>/dev/null || echo "node not found"
```

**After running these commands, share the output** - I'll use it to update the deployment script with the correct Node.js path.

---

### Step 2: Update Deployment Script with Node.js Path

Once we know where Node.js is located, I'll update the deployment script to use that path.

---

### Step 3: Set Up Node.js Application in cPanel (For Backend API)

**This is for running your backend API, not for building:**

1. Go to cPanel → **Node.js Selector** → **+ CREATE APPLICATION**

2. Fill in the form:
   - **Node.js version:** Select **20.17.0** (the one you have available)
   - **Application mode:** `production`
   - **Application root:** `/home/paaera/api`
   - **Application URL:** `paaera.com` or create subdomain like `api.paaera.com`
   - **Application startup file:** `dist/server.js`
   - Click **CREATE**

3. After creating, you'll see the app in the list. Note:
   - The **Application root** path
   - The **Application URL**

---

### Step 4: Configure Environment Variables

Once the Node.js app is created, you'll need to set environment variables:

1. In cPanel Node.js Selector, click on your app (pencil icon to edit)
2. Add environment variables:
   - `NODE_ENV=production`
   - `PORT=5001` (or the port assigned by cPanel)
   - `DATABASE_URL=mysql://username:password@localhost:3306/database_name`
   - `JWT_SECRET=your_jwt_secret_here`
   - `CLIENT_URL=https://paaera.com`
   - `API_URL=https://api.paaera.com` (or your backend URL)

---

### Step 5: Test Deployment

After setting up everything:

1. Push code to GitHub (will trigger automatic deployment)
2. Check GitHub Actions for deployment status
3. Verify frontend at: `https://paaera.com`
4. Verify backend at your Node.js app URL

---

## Alternative: Build Locally and Deploy Built Files

If Node.js is not accessible during deployment, we can:

1. **Build on GitHub Actions** (using GitHub's Node.js environment)
2. **Upload only built files** to your cPanel server
3. **Skip building on the server**

This approach requires updating the workflow to:
- Build frontend and backend in GitHub Actions
- Upload built files via SSH
- Only deploy, not build on server

---

## Next Steps

**Please run the Node.js detection commands from Step 1 in your cPanel Terminal and share the output.**

Once I have that, I'll:
1. Update the deployment script with the correct Node.js path
2. Complete the setup
3. Test the deployment

**What to share:**
- Output of all the `find` commands from Step 1
- Or if you see a specific Node.js path in the output

Then we'll complete the setup! 🚀
