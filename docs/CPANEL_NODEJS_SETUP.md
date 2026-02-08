# Step-by-Step: Set Up Node.js App in cPanel

## Before Deployment

Set up the Node.js application in cPanel first so your backend API can run after deployment.

---

## Step 1: Access Node.js Selector

1. Log into your cPanel: `https://secure.cbnex.com:2083`
2. Find **Node.js Selector** (search for "Node.js" if needed)
3. Click on **Node.js Selector**

---

## Step 2: Create New Node.js Application

1. Click **+ CREATE APPLICATION** button

2. Fill in the form:

   **Node.js version:**
   - Select **20.17.0** (or the latest available, preferably 18+)

   **Application mode:**
   - Select **production**

   **Application root:**
   - Enter: `/home/paaera/api`
   - This is where your backend will be deployed

   **Application URL:**
   - Option 1: Use main domain: `paaera.com` (choose from dropdown)
   - Option 2: Create subdomain: `api.paaera.com` (recommended)
     - If using subdomain, first create it in cPanel → Subdomains
     - Then select it from dropdown

   **Application startup file:**
   - Enter: `dist/server.js`
   - This is your backend entry point

3. Click **CREATE**

---

## Step 3: Configure Environment Variables

After creating the app:

1. Find your app in the list
2. Click the **pencil icon** (Edit) next to your app
3. Scroll down to **Environment Variables** section
4. Click **+ ADD VARIABLE** for each:

   ```
   NODE_ENV=production
   PORT=5001
   DATABASE_URL=mysql://your_username:your_password@localhost:3306/your_database
   JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
   CLIENT_URL=https://www.paaera.com
   API_URL=https://api.paaera.com
   ```
   **Important for CORS:** Use `https://www.paaera.com` if your frontend is at www. Use `https://api.paaera.com` for API_URL when using the api subdomain.

   **Important:** Replace placeholders:
   - `your_username`: Your MySQL username
   - `your_password`: Your MySQL password
   - `your_database`: Your database name
   - `your_super_secret_jwt_key_min_32_characters_long`: A strong random string

5. Click **SAVE**

---

## Step 4: Start the Application

1. In Node.js Selector, find your app
2. Click **Start** button (green play icon ▶️)
3. Wait for status to show "started (v20.17.0)"
4. Check the logs if there are any errors

---

## Step 5: Verify Backend is Running

After deployment completes and app is started:

1. **Test backend endpoint:**
   - Visit: `https://paaera.com/health` (or your backend URL + `/health`)
   - Should return: `{"success":true,"message":"Server is running"}`

2. **Check logs:**
   - In Node.js Selector, click on your app
   - View logs for any errors

---

## Troubleshooting

### CORS errors / 503 Service Unavailable on api.paaera.com:
- **503** means the proxy is not getting a response from Node – the app is likely **stopped** or **crashing**.
- Browser shows "No Access-Control-Allow-Origin" because the 503 response from the proxy has no CORS headers.
- **Fix:** Start (or Restart) the Node.js app in cPanel. Set `CLIENT_URL=https://www.paaera.com`. See **PAAERA_CORS_AND_503_FIX.md** (and **PAAERA_CORS_AND_503_FIX_BANGLA.md**) for full steps.

### App won't start:
- Check that `~/api/dist/server.js` exists (after deployment)
- Verify environment variables are set correctly
- Check logs for specific error messages

### Database connection error:
- Verify `DATABASE_URL` is correct
- Ensure database user has proper permissions
- Test database connection separately

### Port already in use:
- Change `PORT` in environment variables
- Or stop other Node.js apps using the same port

---

## What Happens Next

After setting up the Node.js app:

1. **GitHub Actions will deploy** your code automatically
2. **Frontend** → `~/public_html` → `https://paaera.com`
3. **Backend** → `~/api` → Runs via Node.js app you just created

**Note:** After each deployment, you may need to **Restart** the Node.js app in cPanel for changes to take effect.

---

## Summary

1. ✅ Go to cPanel → Node.js Selector
2. ✅ Create app with:
   - Root: `/home/paaera/api`
   - Startup: `dist/server.js`
   - Version: 20.17.0 (or latest)
3. ✅ Add environment variables
4. ✅ Start the app
5. ✅ Done!

**After this setup, we'll fix the GitHub Actions workflow to use the build-on-GitHub method instead of trying to build on the server.**
