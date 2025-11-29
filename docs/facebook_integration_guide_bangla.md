# Facebook Integration Setup Guide (বাংলা)

## পরিচিতি (Introduction)

### Facebook Integration কি?

Facebook Integration হল একটি সিস্টেম যার মাধ্যমে আপনি আপনার Facebook Page-এ আসা মেসেজগুলো সরাসরি আপনার Omni CRM সিস্টেমে পাবেন এবং সেখান থেকে উত্তর দিতে পারবেন। এটি একটি Webhook-based সিস্টেম যা Facebook Messenger API ব্যবহার করে।

### কেন এটি প্রয়োজন?

- **কেন্দ্রীয় ব্যবস্থাপনা**: সব Facebook মেসেজ এক জায়গায় দেখতে পারবেন
- **দ্রুত উত্তর**: CRM সিস্টেম থেকে সরাসরি উত্তর দিতে পারবেন
- **কাস্টমার সাপোর্ট**: গ্রাহকদের সাথে যোগাযোগ সহজ হবে
- **মেসেজ ট্র্যাকিং**: সব কথোপকথন ডাটাবেসে সংরক্ষিত থাকবে

### Setup করার পর আপনি কি করতে পারবেন?

- Facebook Page-এ আসা সব মেসেজ ইনবক্সে দেখতে পারবেন
- গ্রাহকদের সাথে চ্যাট করতে পারবেন
- মেসেজের ইতিহাস দেখতে পারবেন
- Conversation status (Open/Closed) ম্যানেজ করতে পারবেন

---

## পূর্বশর্ত (Prerequisites)

### আপনার যা যা লাগবে:

1. **Facebook Account**: একটি ব্যক্তিগত Facebook অ্যাকাউন্ট
2. **Facebook Page**: একটি Facebook Page (নতুন তৈরি করতে পারেন)
3. **Facebook Developer Account**: Developer account তৈরি করতে হবে (ফ্রি)
4. **System Requirements**:
   - Omni CRM সিস্টেম চলমান থাকতে হবে
   - Server running (localhost বা production)
   - Internet connection

### Facebook Page তৈরি করা (যদি না থাকে):

1. https://www.facebook.com এ লগইন করুন
2. উপরে ডানদিকে **+** আইকনে ক্লিক করুন
3. **Page** সিলেক্ট করুন
4. Page name এবং category দিন
5. **Create Page** ক্লিক করুন

---

## ধাপ ১: Facebook Page ID পাওয়ার সহজতম উপায়

Facebook Page ID হল আপনার Page-এর একটি unique identifier (সংখ্যা)। এটি Integration setup করার জন্য প্রয়োজন।

### Method 1: Facebook Page Settings থেকে (সবচেয়ে সহজ এবং সুপারিশকৃত)

**এটি সবচেয়ে সহজ পদ্ধতি:**

1. আপনার Facebook Page-এ যান
2. বাম পাশে **Settings** (⚙️) আইকনে ক্লিক করুন
3. বাম sidebar থেকে **Page info** বা **About** সিলেক্ট করুন
4. Scroll down করুন এবং **Page ID** খুঁজুন
5. Page ID টি কপি করুন (এটি একটি সংখ্যা, যেমন: `123456789012345`)

**Visual Guide:**
```
Settings → Page info → Page ID (নিচে scroll করুন)
```

### Method 2: Graph API Explorer ব্যবহার করে

যদি Method 1 কাজ না করে, এই পদ্ধতি ব্যবহার করুন:

1. https://developers.facebook.com/tools/explorer/ এ যান
2. উপরে ডানদিকে **User or Page** dropdown থেকে আপনার App সিলেক্ট করুন
3. Search box-এ টাইপ করুন: `me?fields=id,name`
4. **Submit** বাটনে ক্লিক করুন
5. Response-এ `id` field-এ আপনার Page ID দেখতে পাবেন

**Example Response:**
```json
{
  "id": "123456789012345",
  "name": "Your Page Name"
}
```

### Method 3: Page URL থেকে

1. আপনার Facebook Page-এ যান
2. Browser-এ **View Page Source** করুন (Right click → View Page Source বা `Ctrl+U`)
3. `Ctrl+F` চাপুন এবং `"page_id"` বা `"pageId"` search করুন
4. যে সংখ্যাটি পাবেন সেটাই আপনার Page ID

**Alternative:**
- Page URL: `https://www.facebook.com/YourPageName`
- `https://www.facebook.com/YourPageName/about` এ যান
- Page source দেখুন

---

## ধাপ ২: Facebook App তৈরি করা

Facebook App তৈরি করতে হবে Messenger API ব্যবহার করার জন্য।

### Step 1: Facebook Developer Account খোলা

1. https://developers.facebook.com/ এ যান
2. **Get Started** বা **My Apps** বাটনে ক্লিক করুন
3. যদি প্রথমবার হয়, **Continue** ক্লিক করুন
4. আপনার Facebook account দিয়ে লগইন করুন
5. Developer account verification সম্পন্ন করুন (phone number verification লাগতে পারে)

### Step 2: App তৈরি করা

1. **My Apps** dropdown থেকে **Create App** সিলেক্ট করুন
2. App type হিসেবে **Business** সিলেক্ট করুন
3. **Continue** ক্লিক করুন
4. App details দিন:
   - **App Name**: `Omni CRM Integration` (যেকোনো নাম দিতে পারেন)
   - **App Contact Email**: আপনার email address
   - **Business Account**: (Optional) আপনার business account
5. **Create App** বাটনে ক্লিক করুন
6. Security check সম্পন্ন করুন (যদি চায়)

### Step 3: App Dashboard

App তৈরি হওয়ার পর আপনি App Dashboard-এ যাবেন। এখানে আপনি দেখবেন:
- App ID
- App Secret
- বিভিন্ন Products (Messenger, Webhooks, etc.)

**Important:** App ID এবং App Secret পরে প্রয়োজন হতে পারে, তাই safe রাখুন।

---

## ধাপ ৩: Messenger Product যোগ করা

Messenger API enable করতে হবে messages receive করার জন্য।

### Step 1: Messenger Product যোগ করা

1. আপনার App Dashboard-এ যান
2. **Add Product** বা **+ Add Product** বাটনে ক্লিক করুন
3. Product list থেকে **Messenger** খুঁজুন
4. Messenger-এর পাশে **Set Up** বাটনে ক্লিক করুন
5. Messenger setup page-এ redirect হবে

### Step 2: Messenger Settings

Messenger setup page-এ আপনি দেখবেন:
- **Access Tokens** section
- **Webhooks** section
- **App Review** section

এখন আমরা Access Token এবং Webhook setup করবো।

---

## ধাপ ৪: Access Token পাওয়া

Access Token হল Facebook API-তে access পাওয়ার জন্য একটি key। দুই ধরনের token আছে:

1. **User Access Token**: Temporary (১-২ ঘণ্টা valid)
2. **Page Access Token**: Long-lived (Production-এর জন্য)

### Method 1: Graph API Explorer ব্যবহার করে (Testing এর জন্য)

**এই পদ্ধতি quick testing-এর জন্য ভালো:**

1. https://developers.facebook.com/tools/explorer/ এ যান
2. উপরে ডানদিকে **User or Page** dropdown থেকে আপনার App সিলেক্ট করুন
3. **Get Token** dropdown থেকে **Get User Access Token** সিলেক্ট করুন
4. Permissions window খুলবে
5. এই permissions select করুন:
   - ✅ `pages_show_list` - আপনার pages list দেখার জন্য
   - ✅ `pages_messaging` - Messages send/receive করার জন্য
   - ✅ `pages_read_engagement` - Page engagement data পড়ার জন্য
6. **Generate Access Token** বাটনে ক্লিক করুন
7. Facebook permission dialog আসবে, **Continue** করুন
8. Token generate হবে এবং screen-এ দেখাবে
9. **Copy** করুন (এই token পরে দেখতে পাবেন না, তাই save করুন)

**⚠️ সতর্কতা:** এই token শুধুমাত্র ১-২ ঘণ্টা valid থাকবে। Production-এর জন্য Method 2 ব্যবহার করুন।

### Method 2: Permanent Page Access Token (Production - সবচেয়ে ভালো)

**এই পদ্ধতি production-এর জন্য best:**

#### Step 1: Temporary User Access Token নিন

1. Graph API Explorer-এ যান
2. আপনার App select করুন
3. **Get Token** → **Get User Access Token**
4. Permissions select করুন:
   - `pages_show_list`
   - `pages_messaging`
   - `pages_read_engagement`
5. Token generate করুন এবং copy করুন

#### Step 2: Long-lived User Access Token তৈরি করুন

1. Browser-এ এই URL open করুন (আপনার token দিয়ে replace করুন):
```
https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_TEMPORARY_TOKEN
```

2. `YOUR_APP_ID`: আপনার App Dashboard-এ App ID
3. `YOUR_APP_SECRET`: App Dashboard → Settings → Basic → App Secret (Show করুন)
4. `YOUR_TEMPORARY_TOKEN`: Step 1-এ যে token পেয়েছেন

5. Browser-এ response আসবে:
```json
{
  "access_token": "LONG_LIVED_USER_TOKEN",
  "token_type": "bearer",
  "expires_in": 5183944
}
```

6. `access_token` value copy করুন (এটি ৬০ দিন valid)

#### Step 3: Page Access Token নিন

1. এই URL open করুন (আপনার values দিয়ে replace করুন):
```
https://graph.facebook.com/v18.0/YOUR_PAGE_ID?fields=access_token&access_token=LONG_LIVED_USER_TOKEN
```

2. `YOUR_PAGE_ID`: আপনার Facebook Page ID
3. `LONG_LIVED_USER_TOKEN`: Step 2-এ যে token পেয়েছেন

4. Response আসবে:
```json
{
  "access_token": "PAGE_ACCESS_TOKEN",
  "id": "YOUR_PAGE_ID"
}
```

5. **`access_token`** value copy করুন - এটি আপনার **Permanent Page Access Token**

**✅ এই token expire হবে না (যতক্ষণ না আপনি manually revoke করেন)**

### Method 3: App Dashboard থেকে (সবচেয়ে সহজ)

1. আপনার App Dashboard → **Messenger** → **Settings**
2. **Access Tokens** section-এ যান
3. **Add or Remove Pages** dropdown থেকে আপনার Page select করুন
4. **Generate Token** বাটনে ক্লিক করুন
5. Token generate হবে এবং screen-এ দেখাবে
6. **Copy** করুন

**⚠️ Note:** এই token-ও expire হতে পারে। Method 2 সবচেয়ে reliable।

### Token Security Best Practices

- ✅ Token কখনো public repository-তে commit করবেন না
- ✅ `.env` file-এ রাখুন এবং `.gitignore`-এ add করুন
- ✅ Production-এ token encrypt করে রাখুন
- ✅ Token share করবেন না
- ✅ যদি compromise হয়ে যায়, immediately regenerate করুন

---

## ধাপ ৫: Webhook Setup

Webhook হল Facebook-এর একটি mechanism যার মাধ্যমে Facebook আপনার server-এ messages send করবে।

### Step 1: Callback URL তৈরি করা

Callback URL হল আপনার server-এর endpoint যেখানে Facebook messages send করবে।

**Format:**
```
http://your-domain.com/api/webhooks/facebook
```

**Local Testing-এর জন্য:**
```
http://localhost:5001/api/webhooks/facebook
```

**Production-এর জন্য:**
```
https://yourdomain.com/api/webhooks/facebook
```

### Step 2: Local Testing Setup (ngrok ব্যবহার করে)

যেহেতু Facebook localhost-এ directly webhook send করতে পারে না, আমাদের ngrok ব্যবহার করতে হবে।

#### ngrok Install করা

1. https://ngrok.com/download এ যান
2. আপনার operating system অনুযায়ী download করুন
3. Install করুন
4. ngrok account তৈরি করুন (ফ্রি)
5. Authtoken copy করুন

#### ngrok Setup

1. Terminal/Command Prompt open করুন
2. ngrok authenticate করুন:
```bash
ngrok config add-authtoken YOUR_AUTHTOKEN
```

3. ngrok start করুন (আপনার server port):
```bash
ngrok http 5001
```

4. ngrok একটি URL দেবে, যেমন:
```
Forwarding: https://abc123.ngrok.io -> http://localhost:5001
```

5. এই ngrok URL টি copy করুন

#### ngrok URL ব্যবহার করা

আপনার Callback URL হবে:
```
https://abc123.ngrok.io/api/webhooks/facebook
```

**⚠️ Important:** ngrok free version-এ প্রতিবার restart করলে URL change হবে। Stable URL-এর জন্য paid plan নিতে হবে।

### Step 3: Verify Token তৈরি করা

Verify Token হল একটি secret string যা Facebook webhook verify করার সময় ব্যবহার করবে।

1. একটি secure random string তৈরি করুন, যেমন:
   - `my_secure_verify_token_12345`
   - `omni_crm_webhook_2024`
   - বা যেকোনো random string

2. এই token টি মনে রাখুন বা safe জায়গায় save করুন

### Step 4: Facebook App-এ Webhook Setup করা

1. আপনার App Dashboard → **Messenger** → **Settings**
2. **Webhooks** section-এ scroll করুন
3. **Add Callback URL** বা **Setup Webhooks** বাটনে ক্লিক করুন
4. Webhook configuration form fill করুন:
   - **Callback URL**: 
     - Local: `https://your-ngrok-url.ngrok.io/api/webhooks/facebook`
     - Production: `https://yourdomain.com/api/webhooks/facebook`
   - **Verify Token**: আপনার তৈরি করা verify token (যেমন: `my_secure_verify_token_12345`)
5. **Verify and Save** বাটনে ক্লিক করুন

### Step 5: Webhook Verification

Facebook আপনার server-এ একটি GET request send করবে verification-এর জন্য:

```
GET /api/webhooks/facebook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=RANDOM_STRING
```

আপনার server automatically এই request handle করবে এবং `hub.challenge` return করবে। যদি সব ঠিক থাকে, **"Webhook verified successfully"** message দেখবেন।

**যদি verification fail হয়:**
- Verify Token check করুন (Facebook-এ যা দিয়েছেন এবং server `.env`-এ যা আছে)
- Server running আছে কিনা check করুন
- ngrok running আছে কিনা check করুন (local testing-এর জন্য)

### Step 6: Server-এ Verify Token Setup করা

1. আপনার server folder-এ `.env` file open করুন
2. এই line add করুন:
```env
FACEBOOK_VERIFY_TOKEN=my_secure_verify_token_12345
```

3. Facebook-এ যে verify token দিয়েছেন, ঠিক সেই token টি এখানে দিন
4. Server restart করুন

**⚠️ Important:** Facebook-এ যে verify token দিয়েছেন এবং `.env` file-এ যে token আছে, দুটো exactly same হতে হবে।

---

## ধাপ ৬: Webhook Events Subscribe করা

Facebook-এ বিভিন্ন events subscribe করতে হবে যাতে messages receive করতে পারেন।

### Step 1: Events Subscribe করা

1. App Dashboard → **Messenger** → **Settings** → **Webhooks**
2. আপনার webhook-এর পাশে **Manage** বা **Edit** বাটনে ক্লিক করুন
3. **Subscribe to fields** section-এ যান
4. এই events select করুন:
   - ✅ **messages** - Messages receive করার জন্য (অবশ্যই প্রয়োজন)
   - ✅ **messaging_postbacks** - Button clicks handle করার জন্য
   - ✅ **messaging_optins** - Opt-in events
   - ✅ **messaging_deliveries** - Delivery receipts
   - ✅ **messaging_reads** - Read receipts

5. **Save** বাটনে ক্লিক করুন

### Step 2: Page Subscription

1. **Page Subscriptions** section-এ যান
2. আপনার Page select করুন
3. **Subscribe** বাটনে ক্লিক করুন

এখন আপনার Page-এ আসা messages আপনার webhook-এ send হবে।

---

## ধাপ ৭: Application Configuration

এখন আপনার Omni CRM application-এ integration configure করতে হবে।

### Step 1: Server .env File Setup

1. `server/.env` file open করুন
2. এই line add করুন (যদি না থাকে):
```env
FACEBOOK_VERIFY_TOKEN=my_secure_verify_token_12345
```

3. Verify token টি Facebook-এ যে token দিয়েছেন, ঠিক সেই token দিন
4. File save করুন

### Step 2: Settings Page-এ Configuration

1. আপনার Omni CRM application-এ login করুন
2. Sidebar থেকে **Settings** menu-তে যান
3. **Integrations** tab select করুন
4. **Facebook Integration** section-এ যান

### Step 3: Webhook URL Copy করা

1. Settings page-এ **Webhook URL** section দেখবেন
2. URL automatically generate হবে:
   - Local: `http://localhost:5001/api/webhooks/facebook`
   - Production: `https://yourdomain.com/api/webhooks/facebook`
3. **Copy** বাটনে ক্লিক করুন
4. এই URL টি Facebook App Webhook settings-এ paste করুন (যদি আগে না করে থাকেন)

### Step 4: Form Fill করা

1. **Facebook Page ID** field-এ আপনার Page ID দিন (ধাপ ১ থেকে)
2. **Access Token** field-এ আপনার Page Access Token দিন (ধাপ ৪ থেকে)
3. **Active Integration** checkbox check করুন (যদি active করতে চান)
4. **Save Integration** বাটনে ক্লিক করুন

### Step 5: Verification

1. **Integration Status** section-এ দেখবেন:
   - Status: Active/Inactive
   - Last updated date
2. যদি সব ঠিক থাকে, **"Integration saved successfully!"** message দেখবেন

---

## ধাপ ৮: Testing

এখন সব setup সম্পন্ন হয়েছে, test করি।

### Step 1: Server Check করা

1. আপনার server running আছে কিনা check করুন:
```bash
cd server
npm run dev
```

2. Server `http://localhost:5001` এ running থাকতে হবে

### Step 2: ngrok Check করা (Local Testing)

1. Terminal-এ ngrok running আছে কিনা check করুন:
```bash
ngrok http 5001
```

2. ngrok URL active আছে কিনা verify করুন

### Step 3: Test Message Send করা

1. আপনার Facebook Page-এ যান
2. **Message** বাটনে ক্লিক করুন
3. আপনার নিজের account থেকে একটি test message send করুন
4. Message send করুন, যেমন: "Hello, this is a test message"

### Step 4: Verification

1. আপনার Omni CRM application-এ যান
2. Sidebar থেকে **Inbox** menu-তে যান
3. আপনার conversation list-এ নতুন conversation দেখতে পাবেন
4. Conversation click করুন
5. আপনার send করা message দেখতে পাবেন

### Step 5: Reply Test করা

1. Inbox page-এ conversation open করুন
2. Message input box-এ একটি reply type করুন
3. **Send** বাটনে ক্লিক করুন
4. Message send হবে (যদি Facebook API properly configured থাকে)

**✅ যদি সব কিছু কাজ করে, তাহলে integration successful!**

---

## সমস্যা সমাধান (Troubleshooting)

### সমস্যা ১: Webhook Verification Failed

**লক্ষণ:**
- Facebook-এ webhook verify করতে পারছেন না
- "Webhook verification failed" error

**সমাধান:**
1. ✅ Verify Token check করুন:
   - Facebook App-এ যে token দিয়েছেন
   - Server `.env` file-এ যে token আছে
   - দুটো exactly same হতে হবে

2. ✅ Server running আছে কিনা check করুন:
```bash
curl http://localhost:5001/health
```

3. ✅ ngrok running আছে কিনা check করুন (local testing):
```bash
# ngrok terminal check করুন
```

4. ✅ Webhook endpoint accessible আছে কিনা:
```bash
curl https://your-ngrok-url.ngrok.io/api/webhooks/facebook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test
```

### সমস্যা ২: Messages Receive হচ্ছে না

**লক্ষণ:**
- Facebook-এ message send করছেন কিন্তু Inbox-এ দেখতে পাচ্ছেন না

**সমাধান:**
1. ✅ Webhook events subscribed আছে কিনা check করুন:
   - App Dashboard → Messenger → Settings → Webhooks
   - `messages` event subscribed আছে কিনা

2. ✅ Page subscription আছে কিনা:
   - Webhook settings-এ আপনার Page subscribed আছে কিনা

3. ✅ Server logs check করুন:
   - Server terminal-এ webhook requests আসছে কিনা
   - কোনো error আছে কিনা

4. ✅ Access Token valid আছে কিনা:
   - Graph API Explorer-এ token test করুন
   - Token expire হয়ে গেছে কিনা check করুন

5. ✅ Database connection check করুন:
   - Database properly connected আছে কিনা
   - Tables created আছে কিনা

### সমস্যা ৩: Access Token Expired

**লক্ষণ:**
- "Invalid access token" error
- Messages receive হচ্ছে না

**সমাধান:**
1. ✅ নতুন Access Token generate করুন (ধাপ ৪ দেখুন)
2. ✅ Settings page-এ নতুন token update করুন
3. ✅ Save করুন

### সমস্যা ৪: ngrok URL Change হয়ে গেছে

**লক্ষণ:**
- ngrok restart করার পর URL change হয়েছে
- Webhook কাজ করছে না

**সমাধান:**
1. ✅ নতুন ngrok URL copy করুন
2. ✅ Facebook App Webhook settings-এ update করুন
3. ✅ Webhook verify করুন

**Alternative:** ngrok paid plan নিন stable URL-এর জন্য, অথবা production server use করুন।

### সমস্যা ৫: CORS Error

**লক্ষণ:**
- Browser console-এ CORS error
- API calls fail করছে

**সমাধান:**
1. ✅ Server `app.ts`-এ CORS properly configured আছে কিনা check করুন
2. ✅ Client URL `CLIENT_URL` environment variable-এ set আছে কিনা
3. ✅ Server restart করুন

### সমস্যা ৬: Database Error

**লক্ষণ:**
- "Database connection failed" error
- Messages save হচ্ছে না

**সমাধান:**
1. ✅ Database running আছে কিনা check করুন
2. ✅ `.env` file-এ `DATABASE_URL` correct আছে কিনা
3. ✅ Prisma migrations run করেছেন কিনা:
```bash
cd server
npx prisma migrate dev
```

---

## Best Practices (সেরা অনুশীলন)

### Security

1. **Access Token Security:**
   - ✅ Token কখনো public repository-তে commit করবেন না
   - ✅ `.env` file `.gitignore`-এ add করুন
   - ✅ Production-এ token encrypt করুন
   - ✅ Token share করবেন না

2. **Verify Token:**
   - ✅ Strong, random verify token ব্যবহার করুন
   - ✅ Token safe জায়গায় store করুন

3. **HTTPS:**
   - ✅ Production-এ সবসময় HTTPS ব্যবহার করুন
   - ✅ Local testing-এ ngrok HTTPS provide করে

### Token Management

1. **Token Expiration:**
   - ✅ Permanent Page Access Token ব্যবহার করুন (Method 2, ধাপ ৪)
   - ✅ Token expire হওয়ার আগে renew করুন

2. **Token Storage:**
   - ✅ Database-এ token encrypt করে store করুন
   - ✅ Environment variables ব্যবহার করুন

### Production Deployment

1. **Webhook URL:**
   - ✅ Stable domain ব্যবহার করুন
   - ✅ ngrok free version production-এর জন্য suitable নয়

2. **Error Handling:**
   - ✅ Proper error logging implement করুন
   - ✅ Webhook failures handle করুন

3. **Monitoring:**
   - ✅ Webhook requests monitor করুন
   - ✅ Failed requests track করুন

---

## Frequently Asked Questions (FAQ)

### Q1: Facebook Page ID কোথায় পাবো?

**Answer:** 
- সবচেয়ে সহজ: Facebook Page → Settings → Page info → Page ID
- অথবা Graph API Explorer ব্যবহার করুন

### Q2: Access Token কতদিন valid থাকে?

**Answer:**
- User Access Token: ১-২ ঘণ্টা
- Permanent Page Access Token: Expire হয় না (যতক্ষণ manually revoke না করেন)

### Q3: Local testing কিভাবে করবো?

**Answer:**
- ngrok ব্যবহার করুন
- `ngrok http 5001` command run করুন
- ngrok URL Facebook webhook-এ use করুন

### Q4: Webhook verify করতে পারছি না, কি করবো?

**Answer:**
- Verify Token check করুন (Facebook এবং server `.env`-এ same হতে হবে)
- Server running আছে কিনা check করুন
- ngrok running আছে কিনা check করুন (local)

### Q5: Messages receive হচ্ছে না, কেন?

**Answer:**
- Webhook events (`messages`) subscribed আছে কিনা check করুন
- Page subscription আছে কিনা verify করুন
- Access Token valid আছে কিনা test করুন
- Server logs check করুন

### Q6: ngrok URL প্রতিবার change হয়, কি করবো?

**Answer:**
- ngrok paid plan নিন stable URL-এর জন্য
- অথবা production server use করুন

### Q7: Production-এ কিভাবে deploy করবো?

**Answer:**
- Stable domain ব্যবহার করুন
- HTTPS enable করুন
- Environment variables properly set করুন
- Database connection verify করুন

### Q8: Multiple Facebook Pages connect করতে পারবো?

**Answer:**
- হ্যাঁ, প্রতিটি Page-এর জন্য separate integration create করতে পারেন
- প্রতিটির জন্য আলাদা Page ID এবং Access Token লাগবে

### Q9: Access Token কোথায় store করবো?

**Answer:**
- Settings page-এ form fill করলে automatically database-এ save হবে
- `.env` file-এ verify token store করুন

### Q10: Integration delete করতে পারবো?

**Answer:**
- Settings page-এ integration disable করতে পারেন
- অথবা Facebook App-এ webhook remove করুন

---

## সম্পাদনা (Conclusion)

এই guide অনুসরণ করে আপনি successfully Facebook Integration setup করতে পারবেন। যদি কোনো সমস্যা হয়, Troubleshooting section দেখুন অথবা support team-এর সাথে যোগাযোগ করুন।

### Quick Checklist:

- [ ] Facebook Page ID পাওয়া গেছে
- [ ] Facebook App তৈরি করা হয়েছে
- [ ] Messenger Product যোগ করা হয়েছে
- [ ] Page Access Token পাওয়া গেছে
- [ ] Webhook setup করা হয়েছে
- [ ] Verify Token configured করা হয়েছে
- [ ] Webhook events subscribed করা হয়েছে
- [ ] Application-এ integration configured করা হয়েছে
- [ ] Test message successful হয়েছে

**সফলতা কামনা করছি! 🎉**

---

## Additional Resources

- Facebook Messenger API Documentation: https://developers.facebook.com/docs/messenger-platform
- Graph API Explorer: https://developers.facebook.com/tools/explorer/
- ngrok Documentation: https://ngrok.com/docs
- Prisma Documentation: https://www.prisma.io/docs

---

**Last Updated:** 2024
**Version:** 1.0

