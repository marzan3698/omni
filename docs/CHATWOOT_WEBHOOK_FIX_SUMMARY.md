# Chatwoot Webhook Incoming Messages Fix - Implementation Summary

## ✅ Completed Changes

### Phase 1: Database Schema Fix
- ✅ Created migration file: `server/prisma/migrations/add_company_id_to_social_conversations.sql`
- Migration adds `company_id` column to `social_conversations` table
- Updates existing records with correct companyId from integrations
- Adds foreign key constraint and index

### Phase 2: Webhook Endpoint Verification
- ✅ Added webhook test endpoint: `GET /api/chatwoot/webhooks/test`
- Returns webhook URL and integration status
- Provides setup instructions

### Phase 3: Enhanced Error Logging
- ✅ Improved logging throughout `chatwoot.service.ts`
- Added detailed logging at each step:
  - Webhook payload received
  - Integration lookup result
  - Conversation find/create result
  - Message save result
- Logs errors with full context (accountId, conversationId, contactId)

### Phase 4: Webhook Processing Fix
- ✅ Enhanced error handling in `processChatwootWebhook()`
- Added companyId filtering in conversation lookup
- Improved validation for required fields
- Better duplicate message detection
- Detailed error messages for debugging

### Phase 5: Company ID Filtering
- ✅ Added companyId filter to `getConversations()` in chatwoot controller
- ✅ Added companyId filter to `getConversationMessages()` in social service
- ✅ Updated both social and chatwoot controllers to pass companyId

## 📋 Next Steps (Manual Actions Required)

### Step 1: Run Database Migration
```bash
# Option 1: Run SQL migration directly
mysql -u your_username -p your_database < server/prisma/migrations/add_company_id_to_social_conversations.sql

# Option 2: Use the existing fix script (simpler, but less comprehensive)
node server/fix_social_conversations.mjs
```

### Step 2: Verify Integration Settings
Check your database `integrations` table:
```sql
SELECT id, provider, account_id, page_id, is_active, is_webhook_active, company_id 
FROM integrations 
WHERE provider = 'chatwoot';
```

Ensure:
- `is_active = true`
- `is_webhook_active = true`
- `account_id` matches your Chatwoot account ID
- `page_id` matches your Chatwoot inbox ID
- `company_id` is correct

### Step 3: Get Webhook URL
1. Start your server
2. Visit: `http://localhost:5001/api/chatwoot/webhooks/test` (or use your ngrok URL)
3. Copy the `webhookUrl` from the response

### Step 4: Configure Chatwoot Webhook
1. Go to Chatwoot Dashboard → Settings → Integrations → Webhooks
2. Paste the webhook URL from Step 3
3. Select event: `message_created`
4. Save the webhook

### Step 5: Test Webhook
1. Send a test message from Chatwoot (or Facebook Page if connected)
2. Check server logs for webhook processing
3. Verify message appears in Omni CRM Inbox

## 🔍 Debugging

### Check Webhook Endpoint
```bash
# Test webhook endpoint accessibility
curl -X GET http://localhost:5001/api/chatwoot/webhooks/test

# Or with ngrok
curl -X GET https://your-ngrok-url.ngrok.io/api/chatwoot/webhooks/test
```

### Check Server Logs
Look for these log messages:
- `[Chatwoot Webhook] ========== Webhook Processing Started ==========`
- `[Chatwoot Webhook] ✅ Found integration:`
- `[Chatwoot Webhook] ✅ Created new conversation ID:`
- `[Chatwoot Webhook] ✅ Saved message ID:`

### Check Database
```sql
-- Check if conversations are being created
SELECT * FROM social_conversations 
WHERE platform = 'chatwoot' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if messages are being saved
SELECT sm.*, sc.external_user_name, sc.platform 
FROM social_messages sm
JOIN social_conversations sc ON sm.conversation_id = sc.id
WHERE sc.platform = 'chatwoot'
ORDER BY sm.created_at DESC 
LIMIT 10;
```

## 📝 Files Modified

1. `server/prisma/migrations/add_company_id_to_social_conversations.sql` (new)
2. `server/src/services/chatwoot.service.ts` (enhanced error handling)
3. `server/src/controllers/chatwoot.controller.ts` (added test endpoint, companyId filtering)
4. `server/src/routes/chatwoot.routes.ts` (added test route)
5. `server/src/services/social.service.ts` (added companyId parameter)
6. `server/src/controllers/social.controller.ts` (added companyId filtering)

## 🎯 Expected Behavior After Fix

1. **Webhook Reception**: Chatwoot sends webhook → Server receives it
2. **Integration Lookup**: Server finds active Chatwoot integration
3. **Conversation Management**: Server creates/updates conversation with correct companyId
4. **Message Storage**: Server saves message to database
5. **Frontend Display**: React Query auto-refreshes and shows new messages

## ⚠️ Common Issues & Solutions

### Issue: Webhook not receiving events
**Solution**: 
- Check ngrok URL is accessible
- Verify webhook URL in Chatwoot matches ngrok URL
- Check `isWebhookActive = true` in database

### Issue: Messages not appearing in UI
**Solution**:
- Check database for new messages: `SELECT * FROM social_messages ORDER BY created_at DESC LIMIT 5`
- Verify companyId matches logged-in user's companyId
- Check React Query is refreshing (check browser console)

### Issue: "Integration not found" error
**Solution**:
- Verify `accountId` in integration matches Chatwoot account ID
- Check `isActive = true` in database
- Verify integration exists: `SELECT * FROM integrations WHERE provider = 'chatwoot'`

### Issue: "Foreign key constraint failed"
**Solution**:
- Run migration to add company_id column
- Verify companyId exists in companies table
- Update existing conversations with correct companyId

## 📞 Support

If issues persist:
1. Check server logs for detailed error messages
2. Use webhook test endpoint to verify configuration
3. Check database for data consistency
4. Verify ngrok is running and accessible

