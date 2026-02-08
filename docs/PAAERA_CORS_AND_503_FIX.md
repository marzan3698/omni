# paaera.com – CORS Errors & 503 Service Unavailable Fix

This guide is for **paaera.com** (frontend: `https://www.paaera.com`, API: `https://api.paaera.com`) when you see:

- **"Blocked by CORS policy: No 'Access-Control-Allow-Origin' header"**
- **503 Service Unavailable** on `https://api.paaera.com/api/...`

---

## Why You See CORS When the Real Problem Is 503

1. Frontend at **https://www.paaera.com** calls **https://api.paaera.com**.
2. The request hits cPanel’s proxy. If the **Node.js app is not running** (or not responding), the proxy returns **503 Service Unavailable**.
3. That **503 response comes from the proxy**, not from the Express app. The proxy does **not** add CORS headers.
4. The browser then reports: **"No 'Access-Control-Allow-Origin' header"** because the 503 response has no CORS headers.

So: **fix the 503 (get the Node app running and reachable), and CORS will work** because the app code already sends CORS headers.

---

## Fix Checklist (paaera.com + cPanel)

### 1. Node.js App Must Be Running

| Step | Action |
|------|--------|
| 1 | Log in to **cPanel** (e.g. `https://secure.cbnex.com:2083` or your host’s URL). |
| 2 | Open **Setup Node.js App** (or **Node.js Selector**). |
| 3 | Find the app for **api.paaera.com** (or the app whose root is `/home/paaera/api`). |
| 4 | If status is **Stopped**, click **Start** (▶️). |
| 5 | Wait until status is **Running**. |
| 6 | After every deploy from GitHub, **Restart** the app once. |

If the app won’t start, check **Logs** in the same screen (missing `dist/server.js`, wrong env, or DB errors).

---

### 2. Application URL and Root

In **Setup Node.js App** → your app → **Edit**:

| Field | Value (paaera.com) |
|-------|---------------------|
| **Application root** | `/home/paaera/api` |
| **Application URL** | **api.paaera.com** (subdomain). Create the subdomain in cPanel → Subdomains first if needed. |
| **Application startup file** | `dist/server.js` |

Save and **Restart** the app.

---

### 3. Environment Variables (Backend)

In the same **Edit** screen, **Environment Variables** must include:

```env
NODE_ENV=production
PORT=5001
DATABASE_URL=mysql://YOUR_USER:YOUR_PASSWORD@localhost:3306/YOUR_DATABASE
JWT_SECRET=your_long_random_secret_min_32_chars
CLIENT_URL=https://www.paaera.com
API_URL=https://api.paaera.com
```

Important for CORS:

- **CLIENT_URL** must be the exact frontend origin: **`https://www.paaera.com`** (with `www` if that’s what users use). The backend allows both `https://paaera.com` and `https://www.paaera.com` in code; setting `CLIENT_URL` to the main one is still recommended.

After changing any variable, **Save** and **Restart** the Node.js app.

---

### 4. Subdomain and SSL

| Step | Action |
|------|--------|
| 1 | cPanel → **Subdomains** → create **api** for **paaera.com** → **api.paaera.com**. |
| 2 | In **Setup Node.js App**, set **Application URL** to **api.paaera.com** (as above). |
| 3 | cPanel → **SSL/TLS** → install or auto-install SSL for **api.paaera.com** so the API is served over HTTPS. |

---

### 5. Verify Backend Directly

In a browser or with curl:

- **Health:**  
  `https://api.paaera.com/health`  
  Expected: `{"success":true,"message":"Server is running"}`

- **Theme (public):**  
  `https://api.paaera.com/api/theme/settings`  
  Expected: JSON (theme settings), not 503 and not a blank page.

If you get **503** or **connection error**, the request is not reaching the Node app. Then:

- Confirm the app is **Running** and **Restart** it.
- Check **Logs** for crashes (e.g. database connection).
- Confirm **Application URL** is really **api.paaera.com** and the subdomain points to this app.

---

### 6. Database

If the app starts and then crashes, logs often show **"Can't reach database server"** or similar:

- Ensure MySQL/MariaDB is running in cPanel.
- **DATABASE_URL** must match cPanel’s MySQL username, password, and database name.
- Test DB connection (e.g. phpMyAdmin or a small script) if needed.

---

## Summary

| Problem | What to do |
|--------|------------|
| CORS error in browser | Usually caused by 503 from proxy; fix by making the Node app respond. |
| 503 on api.paaera.com | Start (or Restart) Node.js app in cPanel; check Application root and startup file. |
| App won’t start | Check logs; ensure `dist/server.js` exists, env vars are set, and DB is reachable. |
| CORS still after 503 fixed | Ensure **CLIENT_URL** is `https://www.paaera.com` and restart the app. |

After deployment from GitHub: build completes → files go to **api** folder → you **must Restart** the Node.js app in cPanel so the new code runs.

---

## Related Docs

- **CPANEL_NODEJS_SETUP.md** – Full Node.js app setup for paaera.com
- **DEPLOYMENT_CHECKLIST.md** – General deployment checklist
- **GITHUB_CPANEL_AUTO_DEPLOY.md** / **GITHUB_CPANEL_AUTO_DEPLOY_BANGLA.md** – Auto deploy from GitHub
