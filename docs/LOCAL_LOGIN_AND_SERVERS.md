# Local Login & Servers Setup

If you see **"Request failed with status code 500"** (or another error) on login, follow this checklist.

## 1. Backend (Node.js server)

- **Port:** Must run on **5001** (or set `PORT` in server `.env`).
- **Environment:** Create `server/.env` from `docs/server.env.example`. Required:
  - **`JWT_SECRET`** – Any long random string (e.g. `openssl rand -base64 32`). Without it, login returns 500.
  - **`DATABASE_URL`** – MySQL connection string, e.g. `mysql://user:password@localhost:3306/omni_crm`.
- **Database:** MySQL (or MariaDB) must be running and the database created. Run migrations: `cd server && npx prisma migrate deploy` (or your project’s migration command).
- **Start server:**
  ```bash
  cd server
  npm install
  npm run dev
  ```
  If you see **"JWT_SECRET is not set"**, add it to `server/.env`.

## 2. Frontend (React/Vite)

- **Port:** Usually **5173** (or next free port).
- **API URL:** The app calls `VITE_API_URL` or defaults to `http://localhost:5001/api`. Ensure the backend is reachable at that URL.
- **Start client:**
  ```bash
  cd client
  npm install
  npm run dev
  ```
- Open **http://localhost:5173** (or the port Vite prints) and try logging in.

## 3. ngrok (for webhooks, optional)

- Only needed if you use Facebook/Chatwoot webhooks locally.
- Start backend first, then:
  ```bash
  ngrok http 5001
  ```
- **Auto-detect:** Omni CRM automatically detects an active ngrok tunnel. When the server runs on localhost and ngrok is running, the correct `https://xxxx.ngrok.io` base URL is used for webhook callback URLs and OAuth redirect URIs. No need to set `NGROK_URL` manually.
- If you prefer manual control, set `NGROK_URL=https://xxxx.ngrok.io` in `server/.env`.

## 4. If login still fails

- **Backend not running:** You’ll get a network/CORS or connection error. Start the server on 5001.
- **500 with no message:** Check the **terminal where the server is running** for the real error (e.g. DB connection, missing env).
- **500 with message:** In development the server may return a message like `Login failed: JWT_SECRET is not configured` or `connect ECONNREFUSED`. Fix the cause (add `JWT_SECRET`, start MySQL, fix `DATABASE_URL`).
- **401 Invalid email or password:** Credentials are wrong or the user doesn’t exist. Create a user (e.g. SuperAdmin) via seed or register flow.

## 5. Domain / cPanel (production)

- On a live domain (e.g. cPanel Node.js setup), set these environment variables so webhooks and OAuth redirects use the correct base URL:
  - **`API_URL`** or **`PUBLIC_URL`** – Full public URL of your API, e.g. `https://api.yourdomain.com` or `https://yourdomain.com`
- cPanel Node.js environment: Add these in your application’s environment settings (cPanel → Setup Node.js App → Environment variables).
- Priority: `NGROK_URL` > `API_URL` > `PUBLIC_URL` > `BASE_URL`; if none are set, the server uses request headers (x-forwarded-proto/host) or falls back to localhost.

## Quick checklist

- [ ] `server/.env` exists with `JWT_SECRET` and `DATABASE_URL`
- [ ] MySQL is running and database + migrations are applied
- [ ] Backend running: `cd server && npm run dev` (port 5001)
- [ ] Frontend running: `cd client && npm run dev` (e.g. port 5173)
- [ ] (Optional) ngrok running: `ngrok http 5001` for webhooks
