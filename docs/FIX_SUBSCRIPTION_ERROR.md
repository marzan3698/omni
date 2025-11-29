# Fix: Webhook Subscription Check Error

## Problem

When checking webhook subscription status, you see:
```
Error checking subscription. Please verify Page ID and Access Token.
```

## Root Cause

The Access Token is missing required Facebook permissions:
- `pages_manage_metadata` (required to check subscription)
- `pages_read_engagement` (required to access page info)
- `pages_messaging` (required to receive messages)

## Solution: Generate New Access Token with Correct Permissions

### Step 1: Get User Access Token with Permissions

1. Go to [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your App from the dropdown (top right)
3. Click **Get Token** → **Get User Access Token**
4. In the permissions dialog, select these permissions:
   - ✅ `pages_manage_metadata` (Required)
   - ✅ `pages_messaging` (Required)
   - ✅ `pages_read_engagement` (Required)
   - ✅ `pages_show_list` (Optional, but helpful)
5. Click **Generate Access Token**
6. Authorize the app when prompted
7. Copy the token (this is a short-lived token)

### Step 2: Convert to Long-Lived User Token

1. Open this URL in your browser (replace `YOUR_SHORT_TOKEN`):
   ```
   https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_TOKEN
   ```
2. Replace:
   - `YOUR_APP_ID`: Your Facebook App ID (e.g., `1362036352081793`)
   - `YOUR_APP_SECRET`: Your App Secret (found in App Settings → Basic)
   - `YOUR_SHORT_TOKEN`: The token from Step 1
3. You'll get a response like:
   ```json
   {
     "access_token": "LONG_LIVED_USER_TOKEN",
     "token_type": "bearer",
     "expires_in": 5183944
   }
   ```
4. Copy the `access_token` value

### Step 3: Get Page Access Token

1. Open this URL (replace `LONG_LIVED_USER_TOKEN`):
   ```
   https://graph.facebook.com/v21.0/me/accounts?access_token=LONG_LIVED_USER_TOKEN
   ```
2. Find your Page in the response (look for Page ID `833320096533295`)
3. Copy the `access_token` from that Page object
4. This is your **Page Access Token** (long-lived, ~60 days)

### Step 4: Update in Omni CRM

1. Go to **Settings** → **Integrations**
2. Paste the new **Page Access Token** in the Access Token field
3. Click **Save Integration**
4. The subscription check should now work!

## Alternative: Quick Test Token (Temporary)

For quick testing only (expires in 1-2 hours):

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your App
3. Get Token → **Get User Access Token**
4. Select permissions: `pages_manage_metadata`, `pages_messaging`, `pages_read_engagement`
5. Generate token
6. Then get Page Access Token:
   ```
   https://graph.facebook.com/v21.0/me/accounts?access_token=YOUR_USER_TOKEN
   ```
7. Copy the Page's `access_token` and use it in Settings

## Verify Token Has Correct Permissions

Test your token:

```bash
curl "https://graph.facebook.com/v21.0/me/permissions?access_token=YOUR_PAGE_ACCESS_TOKEN"
```

You should see:
- `pages_manage_metadata` with status `granted`
- `pages_messaging` with status `granted`
- `pages_read_engagement` with status `granted`

## Common Errors

### Error 200: "Requires pages_manage_metadata permission"
**Solution:** Generate new token with `pages_manage_metadata` permission

### Error 100: "Requires pages_read_engagement permission"
**Solution:** Generate new token with `pages_read_engagement` permission

### Error 190: "Access token expired"
**Solution:** Generate a new long-lived Page Access Token

## After Fixing

Once you update the Access Token:
1. The subscription check should work
2. You can subscribe your Page to the webhook
3. Messages will start coming to your inbox

---

**Need Help?** Check `docs/facebook_integration_guide_bangla.md` for detailed step-by-step guide in Bangla.

