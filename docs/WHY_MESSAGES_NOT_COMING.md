# Why Messages Are Not Coming to Inbox - Troubleshooting Guide

## Problem
Messages sent to Facebook Page are not appearing in Omni CRM Inbox.

## Common Causes & Solutions

### 1. Webhook Not Receiving Requests from Facebook

**Check:**
- Is ngrok running? (`curl http://127.0.0.1:4040/api/tunnels`)
- Is the webhook URL in Facebook App correct?
- Is the webhook URL accessible from internet?

**Solution:**
1. Verify ngrok is running: `ngrok http 5001`
2. Check ngrok URL matches Facebook webhook URL
3. Test webhook endpoint manually

### 2. Page Not Subscribed to Webhook

**Check:**
```bash
curl "https://graph.facebook.com/v21.0/{PAGE_ID}/subscribed_apps?access_token={PAGE_ACCESS_TOKEN}"
```

**Solution:**
If not subscribed, subscribe the page:
```bash
curl -X POST "https://graph.facebook.com/v21.0/{PAGE_ID}/subscribed_apps?access_token={PAGE_ACCESS_TOKEN}&subscribed_fields=messages,messaging_postbacks,message_deliveries,message_reads"
```

### 3. Webhook Events Not Subscribed

**Check in Facebook App Dashboard:**
- Messenger → Settings → Webhooks
- Check if `messages` field is subscribed

**Solution:**
1. Go to Facebook App Dashboard
2. Messenger → Settings → Webhooks
3. Click on your webhook
4. Under "Subscription Fields", ensure `messages` is checked
5. Save

### 4. Access Token Expired or Invalid

**Check:**
```bash
curl "https://graph.facebook.com/v21.0/me?access_token={PAGE_ACCESS_TOKEN}"
```

**Solution:**
- Generate new Page Access Token
- Update in Omni CRM Settings

### 5. Server Not Processing Webhooks

**Check Server Logs:**
- Look for "Facebook Webhook Received" messages
- Check for any errors in processing

**Solution:**
- Ensure server is running
- Check server console for webhook activity
- Verify webhook endpoint is accessible

### 6. Message Sent from Page Owner (Not Customer)

**Important:** Facebook only sends webhooks for messages from **customers**, not from page owners/admins.

**Solution:**
- Have someone else (not a page admin) send a message
- Or use a test account that's not a page admin

### 7. Webhook URL Changed (ngrok Restarted)

**Check:**
- If ngrok restarted, the URL changed
- Facebook still has old URL

**Solution:**
1. Get new ngrok URL
2. Update webhook URL in Facebook App Dashboard
3. Re-verify webhook

## Step-by-Step Debugging

### Step 1: Check Server Logs
```bash
# Check if webhooks are being received
tail -f /tmp/server.log | grep -i "webhook\|facebook"
```

### Step 2: Test Webhook Endpoint
```bash
curl -X POST https://your-ngrok-url.ngrok-free.dev/api/webhooks/facebook \
  -H "Content-Type: application/json" \
  -d '{"object":"page","entry":[{"id":"test","time":1234567890,"messaging":[{"sender":{"id":"123"},"recipient":{"id":"833320096533295"},"timestamp":1234567890,"message":{"mid":"test","text":"Test"}}]}]}'
```

### Step 3: Check Database
```bash
cd server
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const recent = await prisma.socialMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('Recent messages:', recent.length);
  recent.forEach(m => console.log(m.createdAt, m.content));
  await prisma.\$disconnect();
})();
"
```

### Step 4: Verify Subscription
```bash
curl "https://graph.facebook.com/v21.0/833320096533295/subscribed_apps?access_token=YOUR_TOKEN"
```

## Quick Checklist

- [ ] Server is running
- [ ] ngrok is running and URL is accessible
- [ ] Webhook URL in Facebook matches ngrok URL
- [ ] Page is subscribed to webhook
- [ ] `messages` field is subscribed in Facebook
- [ ] Access token is valid and not expired
- [ ] Message sent from customer (not page admin)
- [ ] Server logs show webhook activity
- [ ] No errors in server console

## Most Common Issue

**90% of cases:** Page is not subscribed to webhook OR message was sent by page admin (not customer).

**Solution:**
1. Subscribe page using Settings page in Omni CRM
2. Have a non-admin send a test message

