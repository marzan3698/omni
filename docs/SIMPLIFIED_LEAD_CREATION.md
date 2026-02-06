# Simplified Lead Creation from Inbox

## Overview

ইনবক্স থেকে লিড তৈরির প্রক্রিয়া সহজ করা হয়েছে। পূর্বে ৩টি অপশন ছিল (Sales Lead, Connection Lead, Research Lead), এখন শুধু একটি সরাসরি ফর্ম।

## New Flow (2 Steps)

### Step 1: প্রোডাক্ট সিলেক্ট করুন
- প্রোডাক্ট লিস্ট থেকে একটি সিলেক্ট করতে হবে (বাধ্যতামূলক)
- প্রোডাক্টের ছবি, নাম ও দাম দেখা যাবে

### Step 2: গ্রাহকের তথ্য
**বাধ্যতামূলক ফিল্ড:**
- গ্রাহকের নাম
- মোবাইল নম্বর

**ঐচ্ছিক ফিল্ড:**
- ক্যাটাগরি
- ইন্টারেস্ট
- ক্যাম্পেইন
- বিবরণ

## Previous Flow (Removed)

পূর্বে যে ৩টি অপশন ছিল:
1. **Sales Lead** - প্রোডাক্ট বিক্রির জন্য (4 steps)
2. **Connection Lead** - নেটওয়ার্কিং/পার্টনারশিপের জন্য (3 steps)
3. **Research Lead** - মার্কেট রিসার্চের জন্য (3 steps)

এখন সরাসরি প্রোডাক্ট ভিত্তিক লিড তৈরি হয়।

## Points Integration

যখন একটি লিড তৈরি হয়:
1. প্রোডাক্টের `leadPoint` ভ্যালু check হয়
2. যে তৈরি করেছে তার `reservePoints` এ যোগ হয়

যখন লিডের status "Won" হয়:
1. `reservePoints` থেকে পয়েন্ট বিয়োগ
2. `mainPoints` এ যোগ

## API Changes

### Create Lead from Inbox

```
POST /api/leads/from-inbox/:conversationId
```

**Required fields:**
- `customerName` - গ্রাহকের নাম
- `phone` - মোবাইল নম্বর
- `productId` - প্রোডাক্ট ID

**Optional fields:**
- `categoryId` - ক্যাটাগরি ID
- `interestId` - ইন্টারেস্ট ID
- `campaignId` - ক্যাম্পেইন ID
- `description` - বিবরণ

**Note:** `title` automatically generated হয়: `{productName} - {customerName}`

## Related Files

- Frontend: `client/src/pages/Inbox.tsx`
- Backend Controller: `server/src/controllers/lead.controller.ts`
- Backend Service: `server/src/services/lead.service.ts`

## Lead Status

লিডের স্ট্যাটাস পরিবর্তন করা যায়:
- **New** - নতুন তৈরি হয়েছে (Pending)
- **Contacted** - যোগাযোগ করা হয়েছে (Working)
- **Qualified** - যোগ্য হিসেবে চিহ্নিত
- **Negotiation** - আলোচনা চলছে
- **Won** - সফল/সম্পন্ন (Complete) - পয়েন্ট ট্রান্সফার হয়
- **Lost** - ব্যর্থ (Failed)
