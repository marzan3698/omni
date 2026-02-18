# GitHub থেকে cPanel অটো ডিপ্লয়মেন্ট গাইড

## Overview
লোকাল থেকে GitHub এ push করলে cPanel এ অটোমেটিক কোড আপডেট হবে।

---

## আপনার সিস্টেম বিশ্লেষণ (ছবি থেকে)

| তথ্য | মান |
|------|-----|
| **Home Directory** | `/home/imocis` |
| **Primary Domain** | imoics.com |
| **public_html** | খালি (web root) |
| **nodevenv** | আছে (Node.js সাপোর্টেড) |
| **GitHub Repo** | https://github.com/marzan3698/omni |
| **Branch** | main |
| **Repo Visibility** | Public |
| **প্রজেক্ট স্ট্রাকচার** | Monorepo: `client/` (React+Vite), `server/` (Node.js+Express) |

---

## Git™ Version Control – Create Form (আইডিয়াল সেটআপ)

**"Create" বাটনে ক্লিক করার পর নিচের মানগুলো দিন:**

| Field | Value | কারণ |
|-------|-------|------|
| **Repository URL** | `https://github.com/marzan3698/omni.git` | GitHub repo এর clone URL |
| **Repository Path** | `omni` | হোমের নিচে `/home/imocis/omni` হবে – Node.js অ্যাপের জন্য `public_html` এর বাইরে রাখা ভালো |
| **Repository Name** (যদি থাকে) | `omni` | চেনার সুবিধার জন্য |
| **Branch** | `main` | GitHub এ ডিফল্ট ব্রাঞ্চ |
| **Deploy Key** (যদি থাকে) | *খালি রাখুন* | Repo Public তাই লাগবে না |
| **Run Deploy** / **Deploy on Webhook** (যদি থাকে) | **Enable** ✓ | Push এলে অটো pull হবে |
| **Deploy Hook URL** | *(Create করার পর দেখাবে)* | পরবর্তী ধাপে GitHub Webhook এ দিতে হবে |

---

## Repository Path কেন `omni`?

- `public_html` খালি – সাধারণত স্ট্যাটিক সাইটের জন্য
- আপনার প্রজেক্টে `client` + `server` দুটো অংশ – Node.js অ্যাপ
- cPanel এ Node.js অ্যাপ সাধারণত `nodevenv` এর সাথে চলে
- `omni` মানে ফাইনাল পাথ: **`/home/imocis/omni`**
- পরে client build করে `public_html` এ স্ট্যাটিক ফাইল ও server আলাদা Node অ্যাপ হিসেবে রান করা যাবে

**Alternate Path (যদি organize করতে চান):** `repositories/omni` → `/home/imocis/repositories/omni`

---

## ধাপগুলো (সিরিয়াল অনুযায়ী)

### ধাপ ১: Git Version Control – DONE ✓
- Git Version Control পেজে পৌঁছেছেন
- Create বাটন দেখা যাচ্ছে

### ধাপ ২: Create ফর্ম পূরণ করুন
- উপরের টেবিল অনুযায়ী সব ফিল্ড পূরণ করুন
- "Create" / "Clone" ক্লিক করুন
- সফল হলে repo list এ `omni` দেখাবে

### ধাপ ৩: GitHub Webhook (অটো ডিপ্লয়)
- cPanel Git এ `omni` repo এ "Manage" খুলুন
- "Deploy" / "Pull" সেকশনে **Deploy Hook URL** কপি করুন
- GitHub: **Settings → Webhooks → Add webhook**
  - Payload URL: ওই Deploy Hook URL
  - Content type: `application/json`
  - Events: "Just the push event"

### ধাপ ৪: Node.js ও Build (পরবর্তী ধাপ)
- cPanel Terminal: `cd ~/omni`
- Server: `cd server && npm install && npm run build`
- Client: `cd client && npm install && npm run build`
- cPanel Node.js Selector দিয়ে অ্যাপ চালান

---

*প্রতিটি ধাপের আপডেট এখানে যোগ করা হবে।*
