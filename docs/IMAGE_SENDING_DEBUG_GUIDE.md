# Image Sending Debug Guide

## Changes Made

### 1. Enhanced Logging
- Added detailed console logs at every step of the image sending process
- Logs show: conversation details, image URLs, API calls, success/error responses

### 2. Improved Error Handling
- Better multer error handling in routes
- More detailed error messages with API response data
- Proper error propagation

### 3. Debug Logs Added

**Controller Level:**
- `📨 Send reply request:` - Shows incoming request details
- `✅ Image uploaded:` - Confirms file upload
- `📤 Sending message:` - Before calling service
- `✅ Message sent successfully:` - After successful send

**Service Level:**
- `🔵 sendReply called:` - Entry point with parameters
- `✅ Conversation found:` - Conversation details
- `📤 Sending image to Chatwoot/Facebook:` - Image URL being sent
- `📤 Calling Chatwoot API:` - API call details
- `✅ Message sent to Chatwoot/Facebook:` - Success confirmation
- `❌ Error sending...` - Detailed error information

## How to Debug

### Step 1: Check Server Console
When you send an image message, you should see logs like:

```
📨 Send reply request: { conversationId: 1, hasFile: true, fileName: 'image-123.jpg' }
✅ Image uploaded: /uploads/social/image-123.jpg
📤 Sending message: { conversationId: 1, hasContent: false, hasImage: true }
🔵 sendReply called: { conversationId: 1, hasContent: false, hasImage: true, imageUrl: '/uploads/social/image-123.jpg' }
✅ Conversation found: { id: 1, platform: 'chatwoot', externalUserId: 'chatwoot_123_456' }
📤 Sending image to Chatwoot: https://journee-mechanomorphic-soledad.ngrok-free.dev/uploads/social/image-123.jpg
📤 Calling Chatwoot API: { accountId: '143580', conversationId: 456, hasContent: false, hasAttachments: true, attachmentCount: 1 }
✅ Message sent to Chatwoot conversation 456
✅ Message sent successfully: 123
```

### Step 2: Check for Errors

If you see errors, they will look like:

```
❌ Error sending Chatwoot message via API: {
  error: 'Request failed with status code 400',
  response: { error: 'Invalid attachment URL' },
  status: 400
}
```

### Step 3: Common Issues

#### Issue 1: Image URL Not Accessible
**Symptom:** Error about image URL not being accessible
**Solution:** 
- Check `NGROK_URL` is set in `.env`
- Verify ngrok is running and URL is correct
- Test image URL in browser: `https://your-ngrok-url.ngrok-free.dev/uploads/social/image-123.jpg`

#### Issue 2: Multer Error
**Symptom:** File upload fails
**Solution:**
- Check file size (max 5MB)
- Check file type (only images: jpeg, png, gif, webp)
- Check `uploads/social` directory exists and is writable

#### Issue 3: Chatwoot API Error
**Symptom:** Error from Chatwoot API
**Solution:**
- Check access token is valid
- Check account ID and conversation ID are correct
- Check image URL is publicly accessible

#### Issue 4: Facebook API Error
**Symptom:** Error from Facebook Messenger API
**Solution:**
- Check Page Access Token is valid
- Check recipient PSID is correct
- Check image URL is publicly accessible
- Verify Facebook App permissions

### Step 4: Test Image URL Accessibility

Test if the image URL is accessible:

```bash
# Replace with your actual image URL
curl -I https://journee-mechanomorphic-soledad.ngrok-free.dev/uploads/social/image-123.jpg
```

Should return `200 OK` status.

### Step 5: Verify Environment Variables

Check `.env` file has:
```env
NGROK_URL=https://journee-mechanomorphic-soledad.ngrok-free.dev
```

## Next Steps

1. **Send an image message** from Omni Inbox
2. **Watch the server console** for the logs above
3. **Check for any error messages** (❌)
4. **Verify image URL** is accessible
5. **Check API responses** in the logs

## Server Restart

After making changes, restart the server:

```bash
cd server
# Stop current server (Ctrl+C)
npm run dev
```

The server will automatically reload with `tsx watch`.

