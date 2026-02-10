# ফেসবুক ক্রেডেনশিয়াল (App ID, App Secret, Verify Token) – সম্পূর্ণ গাইড (বাংলা)

এই ডকুমেন্টটি Meta-র সর্বশেষ অফিসিয়াল ডকুমেন্টেশন অনুসারে লেখা। আপনি যখন **developers.facebook.com/apps/** এ "No apps yet" দেখছেন, তখন এই ধাপগুলো অনুসরণ করলে আপনি একটি অ্যাপ তৈরি করে **App ID**, **App Secret** এবং ওয়েবহুকের জন্য **Verify Token** পাবেন। Omni CRM-এ ফেসবুক মেসেঞ্জার ইনবক্স কানেক্ট করতে এই মানগুলো দরকার।

---

## আপনি এখন কোথায় আছেন

- আপনি **Facebook for Developers** ওয়েবসাইটে আছেন: `developers.facebook.com/apps/`
- পেজে লেখা: **"No apps yet. To get started, create your first app."**
- সবচেয়ে বড় সবুজ বাটন: **"Create App"**

এর পরের ধাপগুলোই নিচে বিস্তারিত দেওয়া আছে।

---

## অংশ ১: ডেভেলপার হিসেবে রেজিস্ট্রেশন (প্রথমবার করলে)

অ্যাপ তৈরির আগে আপনাকে **Meta Developer** হিসেবে রেজিস্ট্রেশন করতে হবে। একবার করলে পরবর্তীতে শুধু লগইন করলেই হবে।

### ধাপ ১.১: রেজিস্ট্রেশন পেজে যান

- **লিংক:** [https://developers.facebook.com/async/registration](https://developers.facebook.com/async/registration)
- অথবা [developers.facebook.com](https://developers.facebook.com) এ গিয়ে **Get Started** বাটনে ক্লিক করুন।
- **জরুরি:** আপনার ফেসবুক অ্যাকাউন্ট দিয়ে আগে থেকে **লগইন** থাকতে হবে।

### ধাপ ১.২: Terms এবং Policies মানা

- পেজে **Next** ক্লিক করুন।
- Meta-র **Platform Terms** এবং **Developer Policies** মেনে নেওয়ার জন্য এই ক্লিক দরকার।

### ধাপ ১.৩: ফোন ও ইমেইল ভেরিফিকেশন

- Meta একটি **কনফার্মেশন কোড** আপনার দেওয়া **মোবাইল নম্বর** এবং **ইমেইল** এ পাঠাবে।
- কোডগুলো দিয়ে নিশ্চিত করুন যে আপনার সেই নম্বর ও ইমেইলে অ্যাক্সেস আছে।
- ভবিষ্যতে অ্যাপ সম্পর্কিত গুরুত্বপূর্ণ নোটিফিকেশন এই ইমেইল/নম্বরে আসবে।

### ধাপ ১.৪: পেশা সিলেক্ট করুন

- যে অপশনটি আপনার পেশার কাছাকাছি (যেমন Developer, Business Manager, Other) সেটি সিলেক্ট করুন।
- **Next** দিয়ে রেজিস্ট্রেশন সম্পন্ন করুন।

রেজিস্ট্রেশন শেষ হলে আপনি **App Dashboard** ব্যবহার করে অ্যাপ তৈরি করতে পারবেন।

---

## অংশ ২: নতুন অ্যাপ তৈরি (Create App)

### ধাপ ২.১: অ্যাপ তৈরির পেজ খুলুন

- সরাসরি লিংক: [https://developers.facebook.com/apps/creation/](https://developers.facebook.com/apps/creation/)
- অথবা **My Apps** পেজে (যেখানে আপনি এখন আছেন) উপরের **Create App** বাটনে ক্লিক করুন।

### ধাপ ২.২: অ্যাপের নাম ও ইমেইল দিন (App details)

1. **App name:** আপনার অ্যাপের নাম লিখুন (যেমন: `My Company CRM` বা `Omni Inbox`).
   - নামে **Facebook**, **FB**, **Meta** ইত্যাদি ব্যবহার করবেন না; Meta-র গাইডলাইন অনুযায়ী এগুলো ব্যবহার করলে অ্যাপ রিজেক্ট হতে পারে।
2. **Contact email:** যে ইমেইলে Meta আপনাকে নোটিফিকেশন পাঠাবে সেটি দিন।
3. **Next** ক্লিক করুন।

### ধাপ ২.৩: Use Case সিলেক্ট করুন

Use Case মানে আপনার অ্যাপ ফেসবুক/ইনস্টাগ্রামের সাথে *কীভাবে* কাজ করবে (লগইন, পেজ ম্যানেজ, মেসেঞ্জার ইত্যাদি)।

**Omni CRM-এ ফেসবুক পেজের মেসেঞ্জার মেসেজ ইনবক্সে নিতে চাইলে:**

- **"Manage everything on your Page"** বা **"Other"** (যদি পেজ ম্যানেজমেন্ট/মেসেঞ্জার অপশন দেখেন) সিলেক্ট করুন।
- এই Use Case-এ সাধারণত **pages_show_list**, **pages_manage_engagement**, **pages_messaging** এর মতো পারমিশন অটো যোগ হয়, যা পেজের মেসেঞ্জার মেসেজ ও ওয়েবহুকের জন্য দরকার।
- যদি **Other** নেন, তাহলে পরবর্তীতে অ্যাপ ড্যাশবোর্ড থেকে **Messenger** বা **Webhooks** প্রোডাক্ট যোগ করে পেজ সাবস্ক্রাইব করতে পারবেন।
- **Next** ক্লিক করুন।

### ধাপ ২.৪: Business পোর্টফোলিও (Business)

- তিনটি অপশনের যেকোনো একটা বেছে নিন:
  - **A verified business portfolio** – যদি আপনার ভেরিফাইড বিজনেস থাকে।
  - **An unverified business portfolio** – বিজনেস আছে কিন্তু এখনো ভেরিফাইড না।
  - **I don't want to connect a business portfolio yet** – শুধু টেস্ট/ডেভেলপমেন্টের জন্য অনেকেই এটা নেন।
- টেস্ট বা নিজের পেজের জন্য **I don't want to connect a business portfolio yet** দিয়ে এগিয়ে যেতে পারেন।
- **Next** ক্লিক করুন।

### ধাপ ২.৫: Requirements ও Overview

- পরের পেজে আপনার অ্যাপের **Requirements** (যেমন App Review) এবং **Overview** দেখাবে।
- সব ঠিক থাকলে **Go to dashboard** ক্লিক করুন।
- অ্যাপ তৈরি হয়ে আপনি **App Dashboard** এ চলে যাবেন।

---

## অংশ ৩: App ID এবং App Secret কোথায় পাবেন (Basic Settings)

অ্যাপ তৈরি হওয়ার পর **App ID** এবং **App Secret** পেতে হবে। এগুলো **Basic Settings** এ থাকে।

### ধাপ ৩.১: App Dashboard থেকে Basic Settings খুলুন

1. বাম পাশের মেনুতে **App settings** → **Basic** এ ক্লিক করুন।
2. অথবা সরাসরি: [https://developers.facebook.com/apps/](https://developers.facebook.com/apps/) এ আপনার অ্যাপ সিলেক্ট করুন, তারপর **Settings** > **Basic**।

### ধাপ ৩.২: App ID

- পেজের উপরে বা **General** সেকশনে **App ID** একটি নম্বর হিসেবে দেখাবে (যেমন: `1234567890123456`).
- এটাই আপনার **App ID**। Omni CRM-এর **Facebook App Config** পেজে **App ID** ফিল্ডে এই মানটি দিন।

### ধাপ ৩.৩: App Secret

- **App Secret** একটু নিচে **App Secret** লেবেলের পাশে দেখাবে।
- **Show** বাটনে ক্লিক করলে মানটি দেখা যাবে। একবার দেখে নিরাপদ জায়গায় কপি করে রাখুন।
- **সতর্কতা (Meta-র অফিসিয়াল নির্দেশনা):**
  - App Secret **কখনো** পাবলিক কোড, ক্লায়েন্ট অ্যাপ বা গিটহাবে শেয়ার করবেন না।
  - শুধুমাত্র সার্ভার সাইডে (যেমন Omni CRM-এর ব্যাকেন্ড) সেভ করে ব্যবহার করুন।
  - যদি কখনো মনে হয় Secret লিক হয়েছে, **Basic Settings** থেকেই সাথে সাথে **Reset** করুন।

### ধাপ ৩.৪: Display Name, Contact Email, Privacy Policy ইত্যাদি

- **Live mode** এ নিতে চাইলে Display Name, Contact Email, Privacy Policy URL, Terms of Service URL ইত্যাদি পূরণ করতে হবে।
- শুধু ক্রেডেনশিয়াল নিয়ে টেস্ট করলে Development mode-তেই থাকতে পারেন।

---

## অংশ ৪: Verify Token কী এবং কোথায় ব্যবহার করবেন

**Verify Token** ফেসবুক অ্যাপের **Webhooks** সেটআপের সময় ব্যবহার হয়। এটি **আপনি নিজে বানানো একটি স্ট্রিং**; ফেসবুক এটি জেনারেট করে না।

### Verify Token কী

- ওয়েবহুক **Verify** করার সময় ফেসবুক আপনার সার্ভারকে একটি `GET` রিকোয়েস্ট পাঠায় এবং `hub.verify_token` হিসেবে যে মান পাঠায়, আপনার সার্ভার সেটি চেক করে।
- আপনি Omni CRM-এ যে **Verify Token** সেট করবেন, ফেসবুক অ্যাপের ওয়েবহুক কনফিগারেশন পেজে **ঠিক একই** Verify Token লিখতে হবে।
- উদাহরণ: `my_omni_webhook_verify_2024` (কোনো শব্দ/নম্বর দিয়ে নিজের মতো বানাতে পারেন)।

### কোথায় দেবেন

1. **Omni CRM:**  
   **Facebook → App Config** পেজে (অথবা **Settings → Facebook App Config**) **Verify Token** ফিল্ডে এই মান লিখে সেভ করুন।
2. **Facebook App Dashboard:**  
   **Webhooks** সেটআপ করার সময় **Verify Token** ফিল্ডে **ওই একই** মান দিন।

এভাবে দু’জায়গায় একই Verify Token থাকলে ওয়েবহুক ভেরিফিকেশন সফল হবে।

---

## অংশ ৫: সংক্ষিপ্ত চেকলিস্ট – Omni CRM-এ ব্যবহারের জন্য

| ধাপ | কাজ | কোথায় |
|-----|-----|--------|
| ১ | ডেভেলপার রেজিস্ট্রেশন | [developers.facebook.com/async/registration](https://developers.facebook.com/async/registration) |
| ২ | Create App ক্লিক করে অ্যাপ তৈরি | App name + Contact email → Use Case (পেজ ম্যানেজ/Other) → Business → Go to dashboard |
| ৩ | App ID কপি করুন | App Dashboard → **App settings** → **Basic** |
| ৪ | App Secret কপি করুন (Show ক্লিক করে) | একই Basic Settings পেজ |
| ৫ | Verify Token বানান (যেকোনো স্ট্রিং) | নিজে ঠিক করুন, যেমন: `omni_webhook_2024` |
| ৬ | Omni CRM-এ মানগুলো দিন | **Facebook → App Config** এ App ID, App Secret, Verify Token সেভ করুন |
| ৭ | ওয়েবহুক URL সেট করুন | Omni CRM-এর **Facebook App Config** পেজে যে **Webhook Callback URL**, **OAuth Redirect URI** এবং **Verify Token** দেখাবে, সেগুলো কপি বাটন দিয়ে কপি করে ফেসবুক অ্যাপে বসান। প্রতিটি মানের পাশে কপি বাটন আছে। |

---

## অংশ ৫.১: Omni CRM Admin UI – কী কী দেখাবে ও কোথায় বসাবেন

**Facebook App Config** পেজে (credentials সেভ করার পর) তিনটি মান দেখাবে, প্রতিটির পাশে **কপি** বাটন থাকবে:

1. **Webhook Callback URL** – Facebook App Dashboard → Webhooks → Callback URL ফিল্ডে বসান।
2. **OAuth Redirect URI** – Facebook App Dashboard → Facebook Login settings → Valid OAuth Redirect URIs তে যোগ করুন।
3. **Verify Token** – Facebook App Dashboard → Webhooks → Verify Token ফিল্ডে একই মান দিন (Omni CRM-এ যে Verify Token দিয়েছেন সেইটা)।

**লোকালহোস্টে:** ngrok চালু থাকলে Omni CRM অটো-ডিটেক্ট করে সঠিক `https://xxxx.ngrok.io` URL ব্যবহার করবে। ngrok চালু না থাকলে পেজে সতর্কতা দেখাবে এবং `ngrok http 5001` কমান্ড কপি করার সুবিধা পাবেন।

**ডোমেইন/cPanel-এ:** cPanel Node.js environment-এ `API_URL` বা `PUBLIC_URL` সেট করলে সেই ডোমেইন ব্যবহার হবে। Facebook App Config পেজে "Environment & Base URL" সেকশনে বর্তমান Base URL দেখানো হয়।

---

## অংশ ৬: অফিসিয়াল ডকুমেন্টেশন লিংক (সর্বশেষ তথ্যের জন্য)

নিচের লিংকগুলো Meta-র অফিসিয়াল ডকুমেন্টেশন। কোনো পরিবর্তন বা আপডেট জানতে এগুলো দেখতে পারেন।

- **রেজিস্ট্রেশন:**  
  [Register as a Meta Developer](https://developers.facebook.com/docs/development/register)
- **অ্যাপ তৈরি (স্টেপ বাই স্টেপ):**  
  [Create an App with Meta](https://developers.facebook.com/docs/development/create-an-app)
- **App ID ও App Secret (Basic Settings):**  
  [Basic Settings – App Dashboard](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/basic-settings/)
- **পেজ ওয়েবহুক (ওয়েবহুক সেটআপ):**  
  [Webhooks for Pages](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-pages/)
- **Messenger Platform ওয়েবহুক:**  
  [Webhooks – Messenger Platform](https://developers.facebook.com/docs/messenger-platform/webhooks/)

---

## সমস্যা হলে (Troubleshooting)

- **"You have reached the app limit":**  
  একজন ইউজার সর্বোচ্চ **১৫টি** অ্যাপে Developer/Admin হিসেবে থাকতে পারেন (Verified Business সংযুক্ত না থাকলে)। পুরনো বা অপ্রয়োজনীয় অ্যাপ আর্কাইভ/ডিলিট করুন অথবা নিজের রোল সরিয়ে ফেলুন।
- **App Secret ভুলে গেছেন বা লিক হয়েছে:**  
  **App Dashboard → Settings → Basic** এ গিয়ে App Secret **Reset** করুন; তারপর Omni CRM-এর Facebook App Config-এ নতুন Secret আপডেট করুন。
- **ওয়েবহুক ভেরিফাই হয় না:**  
  নিশ্চিত করুন Omni CRM-এ যে Verify Token দিয়েছেন এবং ফেসবুক অ্যাপের ওয়েবহুক পেজে যে Verify Token দিয়েছেন **দুইটা হুবহু একই**।

---

এই গাইডটি Meta-র সর্বশেষ অফিসিয়াল ডকুমেন্টেশন (২০২৪–২০২৫) অনুসারে লেখা। কোনো নিয়ম বা পেজ স্ট্রাকচার বদল হলে উপরের অফিসিয়াল লিংকগুলো থেকে হালনাগাদ তথ্য নিন।
