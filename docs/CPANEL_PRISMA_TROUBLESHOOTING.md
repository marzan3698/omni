# Prisma "timer has gone away" on cPanel – Troubleshooting

## The Error

```
PANIC: timer has gone away
library already starting, this.libraryStarted: false
```

This happens when Prisma runs on cPanel shared hosting with limited process/thread resources.

---

## Fixes (apply in order)

### 1. Reduce connection pool size

Add `connection_limit` to your `DATABASE_URL` in `.env` on the server.

**Current format:**
```
DATABASE_URL="mysql://user:pass@host:3306/dbname"
```

**Updated format:**
```
DATABASE_URL="mysql://user:pass@host:3306/dbname?connection_limit=3&connect_timeout=30"
```

- `connection_limit=3` – limits DB connections per Node process
- `connect_timeout=30` – increases connection timeout (optional)

Edit your `.env` on the server (e.g. `~/omni-repo/server/.env`) and restart the app.

---

### 2. Check process limit (`ulimit`)

In cPanel Terminal:

```bash
ulimit -u
```

If the value is below **50**, contact your host to raise the limit. Prisma needs extra threads for the Query Engine.

---

### 3. Reduce Passenger app processes

In cPanel **Setup Node.js App**:

1. Open your Node.js app settings
2. Look for **"Application processes"** or **"Passenger app processes"**
3. Set it to **1** (or the minimum allowed)

Fewer processes reduce resource usage.

---

### 4. Restart the app

```bash
touch ~/omni-repo/server/tmp/restart.txt
```

---

## Summary

| Step | Action |
|------|--------|
| 1 | Add `?connection_limit=3` to `DATABASE_URL` in `.env` |
| 2 | Check `ulimit -u` (aim for ≥ 50) |
| 3 | Set Passenger app processes to 1 |
| 4 | Restart app via `touch tmp/restart.txt` |

The codebase now uses a Prisma singleton in production to avoid multiple instances, which helps with this error.

---

## Related: Resource Limits (Unable to fork / SCP failure)

### Symptoms

- **cPanel Terminal:** `cagefs_enter: Unable to fork` – cannot run commands
- **Node.js Setup UI:** "Can't save this" when saving environment variables
- **GitHub Actions SCP:** `ssh: unexpected packet in response to channel open`

### Cause

Your cPanel hosting has hit process/resource limits (PMEM, number of processes, or package limits). When the server tries to fork a new process (Terminal, Node.js app config, SCP), it fails.

### Solutions

1. **Contact your hosting provider** – Ask them to:
   - Increase PMEM or process limits
   - Upgrade your hosting plan
   - Check Web Interface Resource Limiting Modes

2. **Reduce usage (temporary):**
   - Set Node.js app processes to 1 (Setup Node.js App → Application processes)
   - Add `connection_limit=3` to `DATABASE_URL` in `.env`
   - Close unused cPanel tabs and apps

3. **Edit `.env` via SSH** – If the Node.js UI fails to save, edit `.env` directly:
   ```bash
   # Via SSH (if Terminal works elsewhere) or File Manager
   nano ~/omni-repo/server/.env
   ```
   Save, then restart: `touch ~/omni-repo/server/tmp/restart.txt`

4. **Manual deployment when GitHub Actions SCP fails** – If SCP fails due to resource limits:
   - Wait for off-peak hours and re-run the workflow
   - Or deploy manually: build locally, then upload `client/dist/*` to `~/public_html/` and `server/dist/*` to `~/omni-repo/server/dist/` via FTP/cPanel File Manager
