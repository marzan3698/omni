# Chatwoot Integration Guide (বাংলা) - Facebook Messages

## পরিচিতি (Introduction)

### Chatwoot Integration কি?

Chatwoot Integration হল একটি সিস্টেম যার মাধ্যমে আপনি Chatwoot-এর মাধ্যমে আপনার Facebook Page-এ আসা মেসেজগুলো সরাসরি আপনার Omni CRM ওয়েব অ্যাপে দেখতে এবং ম্যানেজ করতে পারবেন। 

### কিভাবে এটি কাজ করে?

Chatwoot একটি Customer Support Platform যা Facebook Messenger, WhatsApp, এবং অন্যান্য চ্যানেলের সাথে সংযুক্ত হতে পারে। যখন কেউ আপনার Facebook Page-এ মেসেজ পাঠায়, তখন:

1. **Facebook** → মেসেজটি Chatwoot-এ যায়
2. **Chatwoot** → Webhook এর মাধ্যমে আমাদের সার্ভারে মেসেজ পাঠায়
3. **আমাদের সার্ভার** → মেসেজটি ডাটাবেসে সংরক্ষণ করে
4. **ওয়েব অ্যাপ** → React Query ব্যবহার করে প্রতি ৫-১০ সেকেন্ডে নতুন মেসেজ fetch করে এবং UI-তে দেখায়

---

## সিস্টেম আর্কিটেকচার (System Architecture)

### সম্পূর্ণ ফ্লো (Complete Flow)

```
Facebook Page
    ↓
[User sends message]
    ↓
Chatwoot Platform
    ↓
[Webhook Event: message_created]
    ↓
POST /api/webhooks/chatwoot
    ↓
chatwootController.handleWebhook()
    ↓
chatwootService.processChatwootWebhook()
    ↓
Database (social_conversations + social_messages)
    ↓
Frontend API: GET /api/conversations
    ↓
React Query (auto-refresh every 10 seconds)
    ↓
Inbox.tsx Component
    ↓
User sees message in UI
```

---

## ধাপ ১: Webhook Reception (মেসেজ গ্রহণ)

### 1.1 Webhook Endpoint

যখন Chatwoot-এ নতুন মেসেজ আসে, তখন Chatwoot আমাদের সার্ভারে একটি HTTP POST request পাঠায়:

**Endpoint:** `POST /api/webhooks/chatwoot`

**Location:** `server/src/routes/chatwoot.routes.ts`

```typescript
router.post('/webhooks/chatwoot', chatwootController.handleWebhook);
```

### 1.2 Webhook Handler

Webhook request আসার পর:

1. **তাত্ক্ষণিক 200 Response**: Chatwoot-কে দ্রুত 200 OK response পাঠানো হয় (কারণ Chatwoot expects immediate response)
2. **Asynchronous Processing**: মেসেজ প্রসেসিং background-এ হয়

**Code Location:** `server/src/controllers/chatwoot.controller.ts`

```typescript
handleWebhook: async (req: Request, res: Response) => {
  // Immediate 200 response
  res.status(200).send('EVENT_RECEIVED');
  
  // Process webhook asynchronously
  await chatwootService.processChatwootWebhook(payload);
}
```

---

## ধাপ ২: Webhook Processing (মেসেজ প্রসেসিং)

### 2.1 Webhook Payload Structure

Chatwoot webhook payload এর structure:

```json
{
  "event": "message_created",
  "account": {
    "id": 12345
  },
  "conversation": {
    "id": 67890,
    "contact_inbox": {
      "contact_id": 111
    }
  },
  "contact": {
    "id": 111,
    "name": "John Doe",
    "identifier": "+8801234567890"
  },
  "content": "Hello, I need help",
  "message_type": 0,  // 0 = incoming, 1 = outgoing
  "created_at": 1234567890
}
```

### 2.2 Processing Logic

**Code Location:** `server/src/services/chatwoot.service.ts`

`processChatwootWebhook()` function:

1. **Event Check**: শুধুমাত্র `message_created` event process করে
2. **Data Extraction**: 
   - Account ID
   - Conversation ID
   - Contact ID
   - Message content
   - Message type (incoming/outgoing)
   - Timestamp

3. **Integration Lookup**: Database থেকে Chatwoot integration খুঁজে বের করে
4. **Conversation Management**: 
   - নতুন conversation থাকলে create করে
   - Existing conversation থাকলে update করে
5. **Message Storage**: Message database-এ save করে

### 2.3 Conversation ID Format

Chatwoot conversation ID একটি unique format-এ store করা হয়:

**Format:** `chatwoot_{contactId}_{conversationId}`

**Example:** `chatwoot_111_67890`

এই format ব্যবহার করা হয় কারণ:
- একই contact-এর multiple conversations থাকতে পারে
- Conversation ID দিয়ে Chatwoot API-তে reply পাঠানো যায়

---

## ধাপ ৩: Database Storage (ডাটাবেসে সংরক্ষণ)

### 3.1 Database Tables

#### social_conversations Table

```sql
CREATE TABLE social_conversations (
  id INT PRIMARY KEY,
  company_id INT,
  platform ENUM('facebook', 'chatwoot'),
  external_user_id VARCHAR(255),  -- Format: chatwoot_contactId_conversationId
  external_user_name VARCHAR(255), -- Contact name
  status ENUM('Open', 'Closed'),
  last_message_at DATETIME,
  created_at DATETIME,
  updated_at DATETIME
);
```

#### social_messages Table

```sql
CREATE TABLE social_messages (
  id INT PRIMARY KEY,
  conversation_id INT,
  sender_type ENUM('customer', 'agent'),
  content TEXT,
  created_at DATETIME,
  FOREIGN KEY (conversation_id) REFERENCES social_conversations(id)
);
```

### 3.2 Data Flow

1. **Conversation Creation/Update**:
   - Platform: `'chatwoot'`
   - External User ID: `chatwoot_{contactId}_{conversationId}`
   - External User Name: Contact name বা identifier
   - Status: `'Open'` (default)
   - Last Message At: Current timestamp

2. **Message Creation**:
   - Conversation ID: Linked conversation
   - Sender Type: 
     - `'customer'` → যদি message_type = 0 (incoming)
     - `'agent'` → যদি message_type = 1 (outgoing)
   - Content: Message text
   - Created At: Message timestamp

---

## ধাপ ৪: Frontend Display (UI-তে প্রদর্শন)

### 4.1 API Endpoints

Frontend থেকে conversations fetch করার জন্য:

**GET /api/conversations**
- সব conversations return করে
- Status filter করতে পারে: `?status=Open`
- Platform filter করতে পারে (frontend-এ)

**GET /api/conversations/:id/messages**
- একটি conversation-এর সব messages return করে
- Messages chronological order-এ (oldest first)

### 4.2 React Query Integration

**Code Location:** `client/src/pages/Inbox.tsx`

#### Conversations Fetching

```typescript
const { data: conversations = [] } = useQuery({
  queryKey: ['conversations'],
  queryFn: () => socialApi.getConversations(),
  refetchInterval: 10000, // প্রতি ১০ সেকেন্ডে auto-refresh
});
```

#### Messages Fetching

```typescript
const { data: selectedConversation } = useQuery({
  queryKey: ['conversation', selectedConversationId],
  queryFn: () => socialApi.getConversationMessages(selectedConversationId!),
  enabled: !!selectedConversationId,
  refetchInterval: 5000, // প্রতি ৫ সেকেন্ডে auto-refresh
});
```

### 4.3 Auto-Refresh Mechanism

React Query-এর `refetchInterval` feature ব্যবহার করে:
- **Conversations**: প্রতি ১০ সেকেন্ডে refresh
- **Messages**: প্রতি ৫ সেকেন্ডে refresh (যখন conversation selected থাকে)

এর ফলে:
- নতুন মেসেজ automatically UI-তে দেখা যায়
- Real-time experience পাওয়া যায়
- Manual refresh করার প্রয়োজন নেই

---

## ধাপ ৫: Sending Replies (উত্তর পাঠানো)

### 5.1 Reply Flow

যখন user Inbox-এ থেকে reply পাঠায়:

1. **Frontend**: `socialApi.sendReply(conversationId, content)` call করে
2. **Backend**: `POST /api/conversations/:id/reply` endpoint
3. **Service**: `socialService.sendReply()` function

### 5.2 Chatwoot API Call

**Code Location:** `server/src/services/social.service.ts`

```typescript
async sendReply(conversationId: number, content: string, agentId: string) {
  // 1. Get conversation from database
  const conversation = await prisma.socialConversation.findUnique(...);
  
  // 2. Extract Chatwoot conversation ID
  const chatwootConversationId = extractFromExternalUserId(...);
  
  // 3. Send message via Chatwoot API
  await chatwootService.sendChatwootMessage(
    accountId,
    chatwootConversationId,
    content,
    accessToken,
    baseUrl
  );
  
  // 4. Save message locally in database
  await prisma.socialMessage.create({
    data: {
      conversationId,
      senderType: 'agent',
      content,
      createdAt: new Date(),
    },
  });
}
```

### 5.3 Two-Way Sync

- **Outgoing**: আমাদের app থেকে Chatwoot-এ পাঠানো হয়
- **Incoming**: Chatwoot webhook-এর মাধ্যমে আমাদের app-এ আসে
- **Local Storage**: সব messages (incoming + outgoing) database-এ store হয়

---

## ধাপ ৬: Manual Sync (ম্যানুয়াল সিঙ্ক)

### 6.1 Sync Endpoint

যদি webhook কাজ না করে বা পুরানো messages sync করতে হয়:

**POST /api/chatwoot/sync**

এই endpoint:
1. Chatwoot API থেকে সব conversations fetch করে
2. Database-এ conversations create/update করে
3. প্রতিটি conversation-এর messages fetch করে
4. Messages database-এ save করে

### 6.2 Sync Process

**Code Location:** `server/src/services/chatwoot.service.ts`

```typescript
async syncChatwootConversations(accountId, inboxId, accessToken, baseUrl) {
  // 1. Fetch conversations from Chatwoot API
  const conversations = await this.getChatwootConversations(...);
  
  // 2. For each conversation:
  for (const conv of conversations) {
    // Create or update conversation in database
    let conversation = await prisma.socialConversation.findFirst(...);
    if (!conversation) {
      conversation = await prisma.socialConversation.create(...);
    } else {
      await prisma.socialConversation.update(...);
    }
    
    // 3. Fetch messages for this conversation
    const messages = await this.getChatwootMessages(...);
    
    // 4. Save messages (avoid duplicates)
    for (const msg of messages) {
      const existing = await prisma.socialMessage.findFirst(...);
      if (!existing) {
        await prisma.socialMessage.create(...);
      }
    }
  }
}
```

---

## Integration Setup (ইন্টিগ্রেশন সেটআপ)

### Integration Table Structure

```sql
CREATE TABLE integrations (
  id INT PRIMARY KEY,
  company_id INT,
  provider ENUM('facebook', 'whatsapp', 'chatwoot'),
  page_id VARCHAR(255),        -- For Chatwoot: inbox_id
  access_token TEXT,            -- Chatwoot API access token
  account_id VARCHAR(255),     -- Chatwoot account ID
  base_url VARCHAR(500),       -- Chatwoot base URL (optional)
  is_active BOOLEAN,
  is_webhook_active BOOLEAN,   -- Enable/disable webhook processing
  webhook_mode ENUM('local', 'live'),
  created_at DATETIME,
  updated_at DATETIME
);
```

### Required Fields for Chatwoot

1. **provider**: `'chatwoot'`
2. **page_id**: Chatwoot inbox ID
3. **access_token**: Chatwoot API access token
4. **account_id**: Chatwoot account ID
5. **base_url**: Chatwoot instance URL (optional, defaults to cloud)
6. **is_webhook_active**: `true` (webhook enable করতে)

---

## Webhook Configuration in Chatwoot

### Chatwoot-এ Webhook Setup

1. Chatwoot Dashboard-এ যান
2. Settings → Integrations → Webhooks
3. Webhook URL দিন: `https://your-domain.com/api/webhooks/chatwoot`
4. Events select করুন: `message_created`
5. Save করুন

### Webhook URL Format

- **Production**: `https://your-domain.com/api/webhooks/chatwoot`
- **Development**: `https://your-ngrok-url.ngrok.io/api/webhooks/chatwoot`

---

## Error Handling (এরর হ্যান্ডলিং)

### Common Issues

1. **Webhook Not Receiving Events**
   - Check `is_webhook_active` flag in integrations table
   - Verify webhook URL in Chatwoot dashboard
   - Check server logs for webhook requests

2. **Messages Not Appearing**
   - Check if webhook is processing correctly
   - Verify integration is active
   - Run manual sync: `POST /api/chatwoot/sync`

3. **Duplicate Messages**
   - System automatically checks for duplicates
   - Uses timestamp + content matching
   - 1 second tolerance window

4. **Reply Not Sending**
   - Check Chatwoot API credentials
   - Verify conversation ID format
   - Check server logs for API errors

---

## Database Queries (ডাটাবেস কোয়েরি)

### Get All Chatwoot Conversations

```sql
SELECT * FROM social_conversations 
WHERE platform = 'chatwoot' 
ORDER BY last_message_at DESC;
```

### Get Messages for a Conversation

```sql
SELECT * FROM social_messages 
WHERE conversation_id = ? 
ORDER BY created_at ASC;
```

### Get Active Chatwoot Integration

```sql
SELECT * FROM integrations 
WHERE provider = 'chatwoot' 
AND is_active = true 
LIMIT 1;
```

---

## API Reference (API রেফারেন্স)

### Webhook Endpoint

**POST /api/webhooks/chatwoot**
- **Auth**: Not required (public endpoint)
- **Body**: Chatwoot webhook payload (JSON)
- **Response**: `200 OK` with `'EVENT_RECEIVED'`

### Sync Endpoint

**POST /api/chatwoot/sync**
- **Auth**: Required (JWT token)
- **Body**: `{ integrationId?: number }` (optional)
- **Response**: Sync results with counts

### Get Conversations

**GET /api/conversations**
- **Auth**: Required
- **Query Params**: `?status=Open` (optional)
- **Response**: Array of conversations

### Get Messages

**GET /api/conversations/:id/messages**
- **Auth**: Required
- **Response**: Conversation with messages array

### Send Reply

**POST /api/conversations/:id/reply**
- **Auth**: Required
- **Body**: `{ content: string }`
- **Response**: Created message object

---

## Frontend Components (ফ্রন্টএন্ড কম্পোনেন্ট)

### Inbox.tsx

Main inbox component যা:
- Conversations list দেখায়
- Messages display করে
- Reply functionality প্রদান করে
- Auto-refresh করে (React Query)

**Location:** `client/src/pages/Inbox.tsx`

### socialApi

API functions for social conversations:
- `getConversations()`: Fetch all conversations
- `getConversationMessages()`: Fetch messages for a conversation
- `sendReply()`: Send a reply message

**Location:** `client/src/lib/social.ts`

---

## Best Practices (সেরা অনুশীলন)

1. **Webhook Security**
   - Webhook endpoint public রাখা হয়েছে (Chatwoot থেকে call করতে হবে)
   - Internal validation করে duplicate messages prevent করা হয়

2. **Performance**
   - Auto-refresh interval optimize করা (10s conversations, 5s messages)
   - Database indexes ব্যবহার করা (conversation_id, created_at, etc.)

3. **Error Handling**
   - Webhook errors log করা হয় কিন্তু server crash হয় না
   - API errors gracefully handle করা হয়
   - User-friendly error messages দেখানো হয়

4. **Data Consistency**
   - Duplicate message checking
   - Timestamp-based matching
   - Conversation status synchronization

---

## Troubleshooting (সমস্যা সমাধান)

### Problem: Messages not appearing in UI

**Solution:**
1. Check webhook is active: `SELECT is_webhook_active FROM integrations WHERE provider = 'chatwoot'`
2. Check server logs for webhook requests
3. Run manual sync: `POST /api/chatwoot/sync`
4. Check frontend React Query is running (check browser console)

### Problem: Webhook not receiving events

**Solution:**
1. Verify webhook URL in Chatwoot dashboard
2. Check server is accessible from internet (use ngrok for local dev)
3. Check `is_webhook_active` flag in database
4. Test webhook endpoint manually

### Problem: Reply not sending

**Solution:**
1. Check Chatwoot API credentials (access_token, account_id)
2. Verify conversation ID format in database
3. Check server logs for API errors
4. Test Chatwoot API connection manually

---

## Summary (সারসংক্ষেপ)

### সম্পূর্ণ প্রক্রিয়া:

1. **Facebook** → User মেসেজ পাঠায় Facebook Page-এ
2. **Chatwoot** → Facebook-এর সাথে connected, মেসেজ receive করে
3. **Webhook** → Chatwoot আমাদের সার্ভারে webhook event পাঠায়
4. **Backend** → Webhook process করে, database-এ save করে
5. **Frontend** → React Query auto-refresh করে, UI-তে দেখায়
6. **User** → Inbox-এ মেসেজ দেখে, reply পাঠায়
7. **Backend** → Chatwoot API-তে reply পাঠায়
8. **Chatwoot** → Facebook-এর মাধ্যমে user-কে reply deliver করে

### Key Technologies:

- **Backend**: Node.js + Express + TypeScript
- **Database**: MySQL (via Prisma ORM)
- **Frontend**: React + TypeScript + React Query
- **Integration**: Chatwoot API + Webhooks
- **Real-time**: Polling-based (React Query refetchInterval)

---

## Additional Resources (অতিরিক্ত রিসোর্স)

- Chatwoot API Documentation: https://www.chatwoot.com/docs/product/api
- Facebook Messenger API: https://developers.facebook.com/docs/messenger-platform
- React Query Documentation: https://tanstack.com/query/latest

---

**Last Updated:** 2024
**Version:** 1.0

