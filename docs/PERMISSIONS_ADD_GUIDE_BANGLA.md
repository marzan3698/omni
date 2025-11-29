# Facebook Permissions যোগ করার Guide (Bangla)

## সমস্যা

আপনার Access Token-এ শুধু `pages_read_engagement` permission আছে, কিন্তু আরো ২টি প্রয়োজন:
- ❌ `pages_messaging` (নেই)
- ❌ `pages_manage_metadata` (নেই)
- ✅ `pages_read_engagement` (আছে)

## সমাধান: Permissions যোগ করুন

### ধাপ ১: Graph API Explorer-এ Permissions যোগ করুন

1. **Graph API Explorer** page-এ থাকুন (যেখানে আপনি আছেন)
2. **Right panel**-এ **"Permissions"** tab-এ যান (এখনই selected আছে)
3. **Permission list**-এ scroll করুন এবং খুঁজুন:
   - `pages_messaging` - এটিতে click করুন (blue dot হবে)
   - `pages_manage_metadata` - এটিতে click করুন (blue dot হবে)
4. এখন **৩টি permissions** selected থাকবে:
   - ✅ `pages_messaging`
   - ✅ `pages_manage_metadata`
   - ✅ `pages_read_engagement`

### ধাপ ২: নতুন Access Token Generate করুন

1. **"Generate Access Token"** button-এ click করুন (blue button, token field-এর নিচে)
2. Facebook permission dialog আসবে
3. **"Continue"** বা **"OK"** button-এ click করুন
4. নতুন token generate হবে এবং token field-এ দেখাবে
5. এই token copy করুন (এটি User Access Token)

### ধাপ ৩: Page Access Token নিন

1. Browser-এ **নতুন tab** open করুন
2. এই URL-এ যান (আপনার token দিয়ে replace করুন):
   ```
   https://graph.facebook.com/v21.0/me/accounts?access_token=YOUR_NEW_USER_TOKEN
   ```
3. Response দেখবেন (JSON format):
   ```json
   {
     "data": [
       {
         "access_token": "PAGE_ACCESS_TOKEN_HERE",
         "category": "...",
         "name": "Your Page Name",
         "id": "833320096533295",
         ...
       }
     ]
   }
   ```
4. আপনার Page (ID: `833320096533295`) খুঁজুন
5. Page-এর `access_token` value copy করুন
6. এটি আপনার **Page Access Token** (long-lived, ~60 days)

### ধাপ ৪: Omni CRM-এ Update করুন

1. **Omni CRM Dashboard**-এ যান
2. **Settings** → **Integrations** page-এ যান
3. **Facebook Integration** form-এ:
   - **Access Token** field-এ নতুন Page Access Token paste করুন
   - **Page ID** আছে কিনা check করুন (`833320096533295`)
4. **"Save Integration"** button-এ click করুন
5. **"Webhook Subscription Status"** section-এ:
   - Refresh icon-এ click করুন (status check করতে)
   - এখন error দেখাবে না, subscription status দেখাবে

### ধাপ ৫: Page Subscribe করুন

1. যদি **"Not Subscribed"** দেখায়:
   - **"Subscribe Page to Webhook"** button-এ click করুন
   - Success message দেখবেন
2. এখন **"Subscribed"** status দেখাবে

### ধাপ ৬: Test করুন

1. Facebook Page-এ যান
2. কাউকে দিয়ে Page-এ message পাঠান
3. **Omni CRM Dashboard** → **Inbox**-এ যান
4. Message দেখবেন!

---

## Troubleshooting

### যদি Permission যোগ করতে না পারেন:

1. **"Generate Access Token"** button-এ click করুন
2. Permission dialog-এ সব permissions select করুন
3. **Continue** করুন

### যদি Token Expire হয়ে যায়:

1. নতুন User Access Token generate করুন
2. Step ৩ থেকে শুরু করুন

### যদি Page Access Token না পান:

1. Check করুন User Token-এ `pages_show_list` permission আছে কিনা
2. যদি না থাকে, permission যোগ করুন এবং নতুন token generate করুন

---

## Quick Checklist

- [ ] Graph API Explorer-এ `pages_messaging` permission যোগ করা হয়েছে
- [ ] Graph API Explorer-এ `pages_manage_metadata` permission যোগ করা হয়েছে
- [ ] নতুন User Access Token generate করা হয়েছে
- [ ] Page Access Token নেওয়া হয়েছে
- [ ] Omni CRM Settings-এ নতুন token update করা হয়েছে
- [ ] Subscription status check করা হয়েছে
- [ ] Page subscribe করা হয়েছে

---

## Important Notes

- **User Access Token** শুধু ১-২ ঘণ্টা valid থাকে (short-lived)
- **Page Access Token** ৬০ দিন valid থাকে (long-lived)
- Production-এর জন্য Page Access Token ব্যবহার করুন
- Token expire হলে নতুন token generate করতে হবে

---

**সব ঠিক হলে messages আপনার Inbox-এ আসবে!** 🎉

