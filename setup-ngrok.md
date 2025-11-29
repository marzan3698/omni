# ngrok Setup Instructions

## Quick Setup for Facebook Webhook

### Step 1: Get ngrok Authtoken

1. Go to: https://dashboard.ngrok.com/signup
2. Sign up for a free account (if you don't have one)
3. Go to: https://dashboard.ngrok.com/get-started/your-authtoken
4. Copy your authtoken

### Step 2: Authenticate ngrok

Run this command in terminal (replace YOUR_AUTHTOKEN with your actual token):

```bash
ngrok config add-authtoken YOUR_AUTHTOKEN
```

### Step 3: Start ngrok

Make sure your Omni CRM server is running on port 5001, then run:

```bash
ngrok http 5001
```

### Step 4: Get Your Webhook URL

After starting ngrok, you'll see output like:

```
Forwarding: https://abc123.ngrok.io -> http://localhost:5001
```

Your webhook URL will be:
```
https://abc123.ngrok.io/api/webhooks/facebook
```

### Step 5: Use in Settings Page

1. Go to Omni CRM Settings → Integrations
2. The webhook URL will automatically update if ngrok is running
3. Copy the URL and use it in Facebook App webhook settings

## Notes

- Keep ngrok running while testing
- Free ngrok URLs change each time you restart
- For production, use your actual domain instead of ngrok
