# paaera.com – CORS এরর ও ৫০৩ (Service Unavailable) সমাধান

এই গাইড **paaera.com**-এর জন্য যখন দেখবেন:

- **"CORS policy: No 'Access-Control-Allow-Origin' header"**
- **৫০৩ Service Unavailable** – `https://api.paaera.com/api/...` কল করলে

---

## CORS এরর দেখাচ্ছে কিন্তু আসল সমস্যা ৫০৩ কেন?

১. **https://www.paaera.com** থেকে **https://api.paaera.com** এ রিকোয়েস্ট যায়।  
২. রিকোয়েস্ট প্রথমে cPanel-এর প্রোক্সিতে আসে। যদি **Node.js অ্যাপ চালু না থাকে** (বা রেসপন্ড না করে), প্রোক্সি **৫০৩ Service Unavailable** দেয়।  
৩. এই **৫০৩ রেসপন্স প্রোক্সির**, আমাদের Express অ্যাপের না। প্রোক্সি **CORS হেডার দেয় না**।  
৪. তাই ব্রাউজার বলে: **"No 'Access-Control-Allow-Origin' header"** – কারণ ৫০৩ রেসপন্সে CORS হেডার নেই।

**মূল সমাধান:** ৫০৩ ঠিক করুন = Node অ্যাপ চালু ও সঠিকভাবে রান করানো। তাহলে অ্যাপ নিজে রেসপন্স দেবে এবং CORS হেডার যাবে।

---

## সমাধান চেকলিস্ট (paaera.com + cPanel)

### ১. Node.js অ্যাপ চালু থাকতে হবে

| ধাপ | কাজ |
|-----|-----|
| ১ | **cPanel**-এ লগইন করুন (যেমন `https://secure.cbnex.com:2083`)। |
| ২ | **Setup Node.js App** (বা **Node.js Selector**) খুলুন। |
| ৩ | **api.paaera.com** এর অ্যাপ খুঁজুন (যার root `/home/paaera/api`)। |
| ৪ | স্ট্যাটাস **Stopped** থাকলে **Start** (▶️) ক্লিক করুন। |
| ৫ | স্ট্যাটাস **Running** হওয়া পর্যন্ত অপেক্ষা করুন। |
| ৬ | GitHub থেকে প্রতিবার deploy এর পর অ্যাপ একবার **Restart** করুন। |

অ্যাপ স্টার্ট না হলে একই পেজে **Logs** দেখুন – `dist/server.js` নেই, ভুল env বা ডাটাবেজ এরর থাকতে পারে।

---

### ২. অ্যাপ্লিকেশন URL ও রুট

**Setup Node.js App** → আপনার অ্যাপ → **Edit**:

| ফিল্ড | মান (paaera.com) |
|--------|-------------------|
| **Application root** | `/home/paaera/api` |
| **Application URL** | **api.paaera.com** (সাবডোমেইন)। প্রয়োজন হলে cPanel → Subdomains থেকে আগে সাবডোমেইন বানান। |
| **Application startup file** | `dist/server.js` |

সেভ করে অ্যাপ **Restart** করুন।

---

### ৩. এনভায়রনমেন্ট ভেরিয়েবল (ব্যাকএন্ড)

একই **Edit** পেজে **Environment Variables**-এ অবশ্যই থাকবে:

```env
NODE_ENV=production
PORT=5001
DATABASE_URL=mysql://YOUR_USER:YOUR_PASSWORD@localhost:3306/YOUR_DATABASE
JWT_SECRET=your_long_random_secret_min_32_chars
CLIENT_URL=https://www.paaera.com
API_URL=https://api.paaera.com
```

CORS-এর জন্য গুরুত্বপূর্ণ:

- **CLIENT_URL** ঠিক ফ্রন্টেন্ড অরিজিন: **`https://www.paaera.com`** (ユーザারা www দিয়ে ঢুকলে)। কোডে `https://paaera.com` ও `https://www.paaera.com` দুটোই অ্যালো আছে; তবু CLIENT_URL সঠিক রাখুন।

কোনো ভেরিয়েবল বদলালে **Save** করে Node.js অ্যাপ **Restart** করুন।

---

### ৪. সাবডোমেইন ও SSL

| ধাপ | কাজ |
|-----|-----|
| ১ | cPanel → **Subdomains** → **paaera.com**-এর জন্য **api** সাবডোমেইন বানান → **api.paaera.com**। |
| ২ | **Setup Node.js App**-এ **Application URL** **api.paaera.com** সেট করুন (উপরে অনুযায়ী)। |
| ৩ | cPanel → **SSL/TLS** → **api.paaera.com**-এর জন্য SSL ইনস্টল/অটো ইনস্টল করুন যাতে API HTTPS-এ চলে। |

---

### ৫. ব্যাকএন্ড সরাসরি টেস্ট

ব্রাউজার বা curl দিয়ে:

- **হেলথ:**  
  `https://api.paaera.com/health`  
  প্রত্যাশা: `{"success":true,"message":"Server is running"}`

- **থিম (পাবলিক):**  
  `https://api.paaera.com/api/theme/settings`  
  প্রত্যাশা: JSON (থিম সেটিংস), ৫০৩ বা ফাঁকা পেজ না।

যদি **৫০৩** বা কানেকশন এরর আসে:

- অ্যাপ **Running** কিনা নিশ্চিত করুন এবং **Restart** দিন।
- **Logs** দেখুন – ক্র্যাশ (যেমন ডাটাবেজ কানেকশন) থাকলে ঠিক করুন।
- **Application URL** সত্যিই **api.paaera.com** এবং সাবডোমেইন এই অ্যাপে পয়েন্ট করছে কিনা চেক করুন।

---

### ৬. ডাটাবেজ

অ্যাপ স্টার্ট হয়ে ক্র্যাশ করলে লগে প্রায়ই **"Can't reach database server"** বা এরকম আসে:

- cPanel-এ MySQL/MariaDB চালু আছে কিনা দেখুন।
- **DATABASE_URL** cPanel-এর MySQL ইউজারনেম, পাসওয়ার্ড ও ডাটাবেজ নামের সাথে মিলিয়ে দিন।
- প্রয়োজন হলে phpMyAdmin বা অন্য দিয়ে DB কানেকশন টেস্ট করুন।

---

## সংক্ষেপ

| সমস্যা | করণীয় |
|--------|--------|
| ব্রাউজারে CORS এরর | সাধারণত ৫০৩-এর কারণে; Node অ্যাপ দিয়ে রেসপন্স করালে ঠিক হবে। |
| api.paaera.com এ ৫০৩ | cPanel-এ Node.js অ্যাপ Start/Restart; Application root ও startup file চেক করুন। |
| অ্যাপ স্টার্ট হয় না | Logs দেখুন; `dist/server.js` আছে কিনা, env ও DB ঠিক কিনা দেখুন। |
| ৫০৩ ঠিক হওয়ার পরও CORS | **CLIENT_URL** `https://www.paaera.com` রাখুন এবং অ্যাপ Restart করুন। |

GitHub থেকে deploy এর পর: বিল্ড হয় → ফাইল **api** ফোল্ডারে যায় → cPanel-এ Node.js অ্যাপ **Restart** করতে হবে যাতে নতুন কোড রান করে।

---

## সম্পর্কিত ডক

- **CPANEL_NODEJS_SETUP.md** – paaera.com-এর Node.js অ্যাপ সেটআপ
- **DEPLOYMENT_CHECKLIST.md** – সাধারণ ডিপ্লয় চেকলিস্ট
- **GITHUB_CPANEL_AUTO_DEPLOY.md** / **GITHUB_CPANEL_AUTO_DEPLOY_BANGLA.md** – GitHub অটো ডিপ্লয়
