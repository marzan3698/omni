# cPanel Setup FAQ & Troubleshooting Guide

This document contains solutions to common problems encountered when deploying the Omni CRM application to a cPanel shared hosting environment using Phusion Passenger (Node.js Selector).

---

## 1. File Uploads Fail with `500 Internal Server Error`

**Symptom:**  
When uploading files (like Task Attachments or Theme Logos), the API returns a 500 error, but works perfectly on localhost.

**Causes & Solutions:**

### Cause A: Absolute Path Mismatch (`process.cwd()` vs `__dirname`)
In a cPanel Passenger environment, `__dirname` inside compiled files (e.g., `dist/middleware/upload.js`) resolves differently than in the `src` directory, and going up directory levels (`../../uploads`) might attempt to create folders outside your `api` root (e.g., in `/home/user/uploads` instead of `/home/user/api/uploads`). 
- **Solution:** Always use `process.cwd()` for static upload paths. Passenger reliably sets the current working directory to your app root (e.g., `/home/user/api`).
- **Implementation in `upload.ts`:**
  ```typescript
  const rootUploadsDir = path.join(process.cwd(), 'uploads');
  const taskUploadsBaseDir = path.join(rootUploadsDir, 'tasks');
  ```

### Cause B: MySQL Character Set Crash (Error 1366)
If your cPanel MySQL database uses the default `utf8` character set instead of `utf8mb4`, it has a 3-byte limit per character. If a user uploads a file with an emoji, a Bengali character, or an invisible Mac OS byte in the filename (e.g., `paaera \xC2\x95 (1).png`), the `INSERT` query will crash the database.
- **Solution:** Sanitize the original file name to strip all non-ASCII characters before saving the record to Prisma.
- **Implementation in Controllers:**
  ```typescript
  // Strip non-ASCII bytes/emojis that crash MySQL utf8 charsets
  const sanitizedOriginalName = req.file.originalname.replace(/[^\x00-\x7F]/g, '').trim() || 'attachment';
  ```

### Cause C: Forgotten `prisma db push`
If you added new columns to your Prisma schema (like `subTaskId` in `TaskAttachment`), but the deployment script only ran `npx prisma generate`, inserting a new record will crash with an "Unknown argument" error.
- **Solution:** Always sync your schema to the live database.
- **Command:** SSH into your cPanel or use the cPanel Terminal, navigate to the backend folder (`cd ~/api`), and run:
  ```bash
  npx prisma db push
  ```

---

## 2. Uploaded Images Show "Failed to load image" (404 Error)

**Symptom:**  
Files upload successfully, but when viewing them on the frontend, the image src is broken and the browser console shows a 404 Not Found error.

**Cause:**  
cPanel serves your frontend from `public_html/` (e.g., `https://imoics.com`) and routes your Node.js backend through a specific path like `https://imoics.com/api`. If the frontend requests an image from `https://imoics.com/uploads/...`, cPanel looks in the `public_html` folder, which doesn't have an `uploads` folder. The static files actually live in the Node app and must be routed through Passenger.

**Solution:**  
The frontend must prepend the API base URL (including the `/api` route) to static file paths so that Passenger proxies the request to the Node.js Express server.
- **Implementation in `lib/utils.ts`:**
  Ensure `getStaticFileBaseUrl` returns the full `VITE_API_URL` without stripping the `/api` suffix:
  ```typescript
  export function getStaticFileBaseUrl(): string {
    // VITE_API_URL is https://imoics.com/api
    return import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  }
  ```
- **Implementation in `app.ts`:**
  Ensure Express serves the `uploads` folder on both `/uploads` (for local development) and `/api/uploads` (for Passenger routing).
  ```typescript
  const uploadsPath = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));
  app.use('/api/uploads', express.static(uploadsPath));
  ```

---

## 3. WebSocket / Socket.IO Fails to Connect

**Symptom:**  
Real-time features (chat, task updates) work locally but fail on the live cPanel server with connection timeouts or 404 errors on the `/socket.io/` polling endpoint.

**Cause:**  
By default, Socket.IO connects to the root path `/socket.io/`. However, since Passenger proxies traffic to Node.js via `/api/*`, the WebSocket upgrade requests must also flow through `/api`.

**Solution:**  
Standardize the Socket.IO connection path to `/api/socket.io` for both the frontend client and the backend server.
- **Backend (`socketServer.ts`):**
  ```typescript
  const socketPath = process.env.SOCKET_IO_PATH || '/api/socket.io';
  const io = new SocketIOServer(httpServer, { path: socketPath });
  ```
- **Frontend (`useSocket.ts`):**
  ```typescript
  // Always connect through the /api proxy path
  const socketPath = '/api/socket.io';
  ```

---

## 4. API Returns 403 Permission Denied on Task Attachments

**Symptom:**  
A user is logged in, but uploading an attachment returns `403 Permission denied: Employee record not found`.

**Cause:**  
The system's `verifyTaskUpdateAccess` middleware requires the user to have an associated `Employee` record to update tasks or add attachments. A root Admin or a Client without an employee profile will be blocked unless explicitly handled.

**Solution:**  
Ensure that the user testing the upload is an Employee or a SuperAdmin with bypassed restrictions. In `authMiddleware.ts`, `SuperAdmin` roles automatically bypass this check. 
