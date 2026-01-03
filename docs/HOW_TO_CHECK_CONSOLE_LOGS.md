# How to Check Console Logs for Image Sending

## Console Logs দেখার উপায়

### Method 1: Server Terminal (Recommended)

1. **Server Terminal খুঁজুন:**
   - Cursor/VS Code-এ Terminal panel খুলুন
   - অথবা যেখানে `npm run dev` চালিয়েছেন সেই terminal window খুলুন

2. **Server logs দেখুন:**
   - Server running থাকলে real-time logs দেখতে পাবেন
   - Image send করার সময় এই logs দেখা যাবে:

```
📤 Sending image to Chatwoot: https://your-ngrok-url.ngrok-free.dev/uploads/social/image-123.jpg
✅ Message sent to Chatwoot conversation 12345
```

অথবা Facebook-এর জন্য:

```
📤 Sending image to Facebook: https://your-ngrok-url.ngrok-free.dev/uploads/social/image-123.jpg
✅ Text message sent to Facebook PSID 123456789
✅ Image message sent to Facebook PSID 123456789
```

### Method 2: Check Server Process

Terminal-এ এই command run করুন:

```bash
# Server process check করুন
ps aux | grep "tsx.*server\|node.*server" | grep -v grep
```

### Method 3: Test Image Sending

1. **Omni Inbox-এ যান**
2. **একটি conversation open করুন**
3. **Image select করুন এবং send করুন**
4. **Server terminal-এ logs দেখুন**

## Important: NGROK_URL Environment Variable

Image URL publicly accessible হওয়ার জন্য `NGROK_URL` environment variable set করতে হবে।

### Step 1: .env File-এ Add করুন

`server/.env` file open করুন এবং add করুন:

```env
# Public URL for image access (used for Facebook/Chatwoot image sending)
NGROK_URL=https://journee-mechanomorphic-soledad.ngrok-free.dev
```

**Note:** আপনার ngrok URL যদি different হয়, তাহলে সেই URL use করুন।

### Step 2: Server Restart করুন

Environment variable load করার জন্য server restart করুন:

```bash
# Server stop করুন (Ctrl+C)
# তারপর আবার start করুন
cd server
npm run dev
```

## Console Logs থেকে Debug করা

### Success Logs (সব ঠিক থাকলে):

```
📤 Sending image to Chatwoot: https://journee-mechanomorphic-soledad.ngrok-free.dev/uploads/social/image-123.jpg
✅ Message sent to Chatwoot conversation 12345
```

### Error Logs (সমস্যা থাকলে):

```
❌ Error sending Chatwoot message via API: [error details]
```

অথবা Facebook-এর জন্য:

```
❌ Error sending Facebook message: [error details]
```

### Common Issues:

1. **Image URL not accessible:**
   - Check করুন image URL publicly accessible কিনা
   - Browser-এ image URL open করে test করুন

2. **NGROK_URL not set:**
   - `.env` file-এ `NGROK_URL` add করুন
   - Server restart করুন

3. **Facebook Access Token invalid:**
   - Settings → Integrations → Facebook
   - Access Token update করুন

## Quick Test

Image send করার পর server terminal-এ এই logs দেখা উচিত:

**Chatwoot Platform:**
```
📤 Sending image to Chatwoot: [full-image-url]
✅ Message sent to Chatwoot conversation [id]
```

**Facebook Platform:**
```
📤 Sending image to Facebook: [full-image-url]
✅ Text message sent to Facebook PSID [id] (if text included)
✅ Image message sent to Facebook PSID [id]
```

## Troubleshooting

যদি logs না দেখতে পান:

1. ✅ Server running আছে কিনা check করুন
2. ✅ Terminal/Console window খোলা আছে কিনা check করুন
3. ✅ Image actually send হয়েছে কিনা check করুন (Inbox-এ message দেখুন)
4. ✅ Browser console-এ network errors check করুন (F12 → Network tab)

