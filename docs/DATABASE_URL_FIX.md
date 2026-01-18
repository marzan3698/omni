# Fix DATABASE_URL - URL Encode Special Characters

## Problem
The error `empty host in database URL` occurs because the password contains special characters (`@`, `#`) that need to be URL-encoded in the connection string.

## Solution

In cPanel Node.js Selector → Environment Variables for your app:

### Current (INCORRECT):
```
DATABASE_URL=mysql://paaera_omniuser:ADittorahmanm12@#@localhost:3306/paaera_database_omni
```

### Fixed (CORRECT):
```
DATABASE_URL=mysql://paaera_omniuser:ADittorahmanm12%40%23%40@localhost:3306/paaera_database_omni
```

## URL Encoding Reference
- `@` → `%40`
- `#` → `%23`
- `:` → `%3A` (if needed)
- `/` → `%2F` (if needed)
- `?` → `%3F` (if needed)
- `&` → `%26` (if needed)

## Steps
1. Go to cPanel → Node.js Selector
2. Find your app (`api.paaera.com`)
3. Click "Manage" or "Edit"
4. Find `DATABASE_URL` in Environment Variables
5. Replace `ADittorahmanm12@#@` with `ADittorahmanm12%40%23%40`
6. Save changes
7. Restart the Node.js app

## Test After Fix
```bash
cd ~/api
tail -f stderr.log
```

Then try logging in - the error should be gone.
