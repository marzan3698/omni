# Facebook Webhook Debugging Guide

## Problem: Messages Not Coming to Dashboard Inbox

After publishing your Facebook App, if messages from your Facebook Page are not appearing in the Omni CRM dashboard inbox, follow these steps:

---

## Step 1: Verify Webhook Subscription Status

### Check in Facebook App Dashboard:

1. Go to **Meta for Developers** → Your App → **Messenger** → **Webhooks**
2. Check if your webhook shows:
   - ✅ **Status: Active** (green)
   - ✅ **Callback URL**: `https://your-ngrok-url.ngrok-free.dev/api/webhooks/facebook`
   - ✅ **Verify Token**: Matches your `.env` file

### Verify Subscription Fields:

1. Click on **Webhooks** → Your webhook
2. Under **Subscription Fields**, ensure these are checked:
   - ✅ `messages`
   - ✅ `messaging_postbacks` (optional)
   - ✅ `message_deliveries` (optional)
   - ✅ `message_reads` (optional)

---

## Step 2: Subscribe Your Page to the Webhook

**This is the most common issue!** Your Page must be subscribed to receive webhook events.

### Method 1: Via Facebook App Dashboard (Recommended)

1. Go to **Messenger** → **Webhooks**
2. Click on your webhook
3. Under **Subscriptions**, find your Page
4. If it shows "Not Subscribed", click **Subscribe** button
5. Select the subscription fields you want (at minimum: `messages`)

### Method 2: Via Graph API (Programmatic)

You can subscribe your Page using this API call:

```bash
curl -X POST "https://graph.facebook.com/v21.0/{PAGE_ID}/subscribed_apps?access_token={PAGE_ACCESS_TOKEN}"
```

Replace:
- `{PAGE_ID}`: Your Facebook Page ID (e.g., `833320096533295`)
- `{PAGE_ACCESS_TOKEN}`: Your Page Access Token

**Example:**
```bash
curl -X POST "https://graph.facebook.com/v21.0/833320096533295/subscribed_apps?access_token=YOUR_PAGE_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "success": true
}
```

---

## Step 3: Verify Page Access Token Permissions

Your Page Access Token must have these permissions:

1. Go to **Meta for Developers** → Your App → **Messenger** → **Settings**
2. Under **Access Tokens**, find your Page
3. Click **View Token** and verify it has:
   - ✅ `pages_messaging` permission
   - ✅ `pages_manage_metadata` permission (optional)

### Check Token Permissions via API:

```bash
curl "https://graph.facebook.com/v21.0/me/permissions?access_token={PAGE_ACCESS_TOKEN}"
```

Look for `pages_messaging` in the response.

---

## Step 4: Test Webhook Reception

### Check Server Logs:

1. Make sure your server is running
2. Send a test message to your Facebook Page
3. Check your server console for:
   ```
   === Facebook Webhook Received ===
   📦 Payload type: page
   📨 Number of entries: 1
   ```

### Test Webhook Manually:

You can test if your webhook is accessible:

```bash
curl -X GET "https://your-ngrok-url.ngrok-free.dev/api/webhooks/facebook?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test123"
```

Expected response: `test123`

---

## Step 5: Verify ngrok is Running

1. Check if ngrok is running:
   ```bash
   curl http://127.0.0.1:4040/api/tunnels
   ```

2. Verify the public URL matches your webhook URL in Facebook

3. If ngrok restarted, update the webhook URL in Facebook App settings

---

## Step 6: Check Database for Messages

Run this to see if messages are being saved:

```bash
cd server
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const messages = await prisma.socialMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { conversation: true }
  });
  console.log('Recent messages:', messages.length);
  messages.forEach(m => {
    console.log(\`\${m.createdAt}: \${m.content.substring(0, 50)}...\`);
  });
  await prisma.\$disconnect();
})();
"
```

---

## Step 7: Common Issues & Solutions

### Issue 1: "Webhook subscription failed"
**Solution:**
- Verify the webhook URL is accessible (not localhost)
- Check verify token matches exactly
- Ensure ngrok is running

### Issue 2: "Page not subscribed"
**Solution:**
- Go to Messenger → Webhooks → Subscribe your Page
- Or use the Graph API method above

### Issue 3: "Messages received but not saved"
**Solution:**
- Check server logs for errors
- Verify database connection
- Check Prisma schema matches

### Issue 4: "Webhook shows active but no messages"
**Solution:**
- Verify Page is subscribed (Step 2)
- Check subscription fields include `messages`
- Test by sending a message to your Page

---

## Step 8: Enable Webhook Debugging

Add this to your server logs to see all webhook activity:

The webhook handler already logs:
- ✅ Webhook reception timestamp
- ✅ Payload type and structure
- ✅ Message processing steps
- ✅ Database save confirmations

Check your server console when a message is sent to your Page.

---

## Quick Checklist

Before reporting issues, verify:

- [ ] Webhook URL is accessible (not localhost)
- [ ] Webhook shows "Active" status in Facebook
- [ ] Page is subscribed to the webhook
- [ ] Subscription fields include `messages`
- [ ] Page Access Token has `pages_messaging` permission
- [ ] ngrok is running and URL matches webhook URL
- [ ] Server is running and receiving webhooks (check logs)
- [ ] Database connection is working

---

## Next Steps After Fixing

Once messages start coming:

1. **Test with a real message** from someone else (not your test account)
2. **Check the Inbox page** in Omni CRM dashboard
3. **Verify message content** is saved correctly
4. **Test reply functionality** from the dashboard

---

## Need More Help?

If messages still don't appear:

1. Share your server logs (last 50 lines)
2. Share a screenshot of your Facebook Webhook settings
3. Share the result of the subscription check API call

