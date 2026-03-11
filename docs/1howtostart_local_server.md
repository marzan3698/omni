# 🚀 লোকাল সার্ভার কীভাবে শুরু করবেন (Omni CRM)

## ✅ প্রয়োজনীয় জিনিস (Prerequisites)

শুরু করার আগে নিশ্চিত করুন নিচের সফটওয়্যারগুলো ইনস্টল আছে:

| সফটওয়্যার | ডাউনলোড লিঙ্ক |
|---|---|
| **Node.js** (v18+) | https://nodejs.org |
| **XAMPP** (MySQL এর জন্য) | https://www.apachefriends.org |
| **Git** | https://git-scm.com |

---

## ধাপ ১: XAMPP চালু করুন (MySQL Database)

1. **XAMPP Control Panel** খুলুন।
2. **MySQL** এর পাশে **Start** বাটনে ক্লিক করুন।
3. MySQL সবুজ রঙে দেখালে ডেটাবেজ চালু হয়েছে।

> ⚠️ **গুরুত্বপূর্ণ:** MySQL চালু না থাকলে ব্যাকএন্ড কাজ করবে না।

---

## ধাপ ২: পুরনো সার্ভার বন্ধ করুন

যদি আগের কোনো সার্ভার চলমান থাকে, প্রথমে বন্ধ করুন। Terminal খুলে নিচের কমান্ড দিন:

```bash
kill -9 $(lsof -t -i:5001) $(lsof -t -i:5173) 2>/dev/null || echo "পোর্ট ফাঁকা আছে"
```

---

## ধাপ ৩: ব্যাকএন্ড সার্ভার শুরু করুন

একটি নতুন **Terminal** উইন্ডো খুলুন এবং নিচের কমান্ডগুলো দিন:

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/omni/server
npm run dev
```

সফল হলে দেখাবে:
```
🚀 Server is running on http://0.0.0.0:5001
📊 Environment: development
🔌 Socket.IO server initialized
```

---

## ধাপ ৪: ফ্রন্টএন্ড সার্ভার শুরু করুন

আরেকটি নতুন **Terminal** উইন্ডো খুলুন:

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/omni/client
npm run dev
```

সফল হলে দেখাবে:
```
VITE v7.x  ready in 300ms
➜  Local:   http://localhost:5173/
```

---

## ধাপ ৫: ব্রাউজারে যান

ব্রাউজার খুলুন এবং এই লিঙ্কে যান:

👉 **http://localhost:5173**

> যদি 5173 পোর্ট পাওয়া না যায়, তাহলে **http://localhost:5174** ব্যবহার করুন।

---

## ডিফল্ট লগইন তথ্য

| ভূমিকা | ইমেইল | পাসওয়ার্ড |
|---|---|---|
| **Super Admin** | `superadmin@imoics.com` | `SuperAdmin@imoics2024` |
| **Admin** | `admin@imoics.com` | `Admin@imoics2024` |

---

## ⚠️ সাধারণ সমস্যা ও সমাধান

### সমস্যা: "Port 5001 is already in use"
```bash
kill -9 $(lsof -t -i:5001)
```
তারপর আবার `npm run dev` দিন।

### সমস্যা: "Cannot connect to database"
- XAMPP-এ MySQL চালু আছে কিনা দেখুন।
- MySQL বন্ধ করে আবার চালু করুন।

### সমস্যা: ব্রাউজারে "Network Error"
- ব্যাকএন্ড সার্ভার চালু আছে কিনা নিশ্চিত করুন (ধাপ ৩ দেখুন)।

---

## সার্ভার বন্ধ করতে

প্রতিটি Terminal উইন্ডোতে **Ctrl + C** চাপুন।
