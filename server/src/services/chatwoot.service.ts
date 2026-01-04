import axios from 'axios';
import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';
import { SocialPlatform, ConversationStatus, SenderType } from '@prisma/client';
import fs from 'fs';
import path from 'path';

interface ChatwootConversation {
  id: number;
  inbox_id: number;
  status: string;
  last_activity_at: string;
  contact: {
    id: number;
    name: string;
    identifier: string;
  };
  messages?: ChatwootMessage[];
}

interface ChatwootMessage {
  id: number;
  content: string;
  message_type: number; // 0: incoming, 1: outgoing
  created_at: number;
  sender?: {
    id: number;
    name: string;
    type: string; // 'contact' or 'user'
  };
}

/**
 * Get Chatwoot API base URL
 */
function getChatwootApiUrl(baseUrl?: string | null): string {
  const defaultUrl = 'https://app.chatwoot.com';
  if (!baseUrl) return defaultUrl;

  // Remove trailing slash if present
  const url = baseUrl.trim().replace(/\/$/, '');
  return url || defaultUrl;
}

/**
 * Get Chatwoot API headers
 */
function getChatwootHeaders(accessToken: string) {
  return {
    'api_access_token': accessToken,
    'Content-Type': 'application/json',
  };
}

export const chatwootService = {
  /**
   * Fetch conversations from Chatwoot API
   */
  async getChatwootConversations(
    accountId: string,
    inboxId: string,
    accessToken: string,
    baseUrl?: string | null
  ): Promise<ChatwootConversation[]> {
    try {
      const apiUrl = getChatwootApiUrl(baseUrl);
      const url = `${apiUrl}/api/v1/accounts/${accountId}/conversations`;

      const response = await axios.get(url, {
        headers: getChatwootHeaders(accessToken),
        params: {
          inbox_id: inboxId,
          // Removed status filter to fetch all conversations (open and closed)
        },
      });

      return response.data.payload || [];
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch Chatwoot conversations';
      console.error('Chatwoot API Error:', errorMessage);
      throw new AppError(`Chatwoot API Error: ${errorMessage}`, error.response?.status || 500);
    }
  },

  /**
   * Fetch messages for a specific conversation from Chatwoot API
   */
  async getChatwootMessages(
    accountId: string,
    conversationId: number,
    accessToken: string,
    baseUrl?: string | null
  ): Promise<ChatwootMessage[]> {
    try {
      const apiUrl = getChatwootApiUrl(baseUrl);
      const url = `${apiUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;

      const response = await axios.get(url, {
        headers: getChatwootHeaders(accessToken),
      });

      return response.data.payload || [];
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch Chatwoot messages';
      console.error('Chatwoot API Error:', errorMessage);
      throw new AppError(`Chatwoot API Error: ${errorMessage}`, error.response?.status || 500);
    }
  },

  /**
   * Send a message via Chatwoot API
   */
  async sendChatwootMessage(
    accountId: string,
    conversationId: number,
    content: string,
    accessToken: string,
    baseUrl?: string | null,
    attachments?: Array<{ type: string; data_url: string }>
  ): Promise<ChatwootMessage> {
    try {
      const apiUrl = getChatwootApiUrl(baseUrl);
      const url = `${apiUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;

      // Chatwoot API attachment handling
      // Based on Chatwoot API docs, attachments should be sent as multipart/form-data
      // with the file directly in the message payload, not uploaded separately
      let formData: any = null;

      if (attachments && attachments.length > 0) {
        const FormDataModule = (await import('form-data')).default;
        formData = new FormDataModule();

        // Add message content
        formData.append('content', content || '');
        formData.append('message_type', 'outgoing');
        formData.append('private', 'false');

        // Add attachments as files
        for (const att of attachments) {
          if (att.data_url && att.data_url.startsWith('data:')) {
            try {
              // Extract base64 data from data URL
              const base64Data = att.data_url.split(',')[1];
              const mimeType = att.data_url.split(';')[0].split(':')[1];

              // Convert base64 to buffer
              const buffer = Buffer.from(base64Data, 'base64');

              // Determine file extension from mime type
              const ext = mimeType.split('/')[1] || 'png';
              const filename = `image.${ext}`;

              // Append file to form data
              // Chatwoot expects 'attachments[]' as the field name
              formData.append('attachments[]', buffer, {
                filename: filename,
                contentType: mimeType,
              });

              console.log('📎 Added attachment to form data:', {
                filename,
                mimeType,
                size: buffer.length,
              });
            } catch (attError: any) {
              console.error('❌ Error processing attachment:', attError.message);
            }
          }
        }

        console.log('📤 Sending message with attachments as multipart/form-data');
      }

      // If we have formData (with attachments), use multipart/form-data
      // Otherwise, use JSON for text-only messages
      let response;

      if (formData) {
        // Send as multipart/form-data for messages with attachments
        console.log('📤 Chatwoot API request (multipart/form-data):', {
          url,
          hasAttachments: true,
          contentLength: content?.length || 0,
        });

        response = await axios.post(
          url,
          formData,
          {
            headers: {
              'api_access_token': accessToken,
              ...formData.getHeaders(),
            },
          }
        );
      } else {
        // Send as JSON for text-only messages
        const payload: any = {
          content: content || '',
          message_type: 'outgoing',
          private: false,
        };

        console.log('📤 Chatwoot API request (JSON):', {
          url,
          payloadKeys: Object.keys(payload),
          contentLength: payload.content?.length || 0,
        });

        response = await axios.post(
          url,
          payload,
          {
            headers: getChatwootHeaders(accessToken),
          }
        );
      }

      console.log('✅ Chatwoot API response:', {
        status: response.status,
        messageId: response.data?.id,
        hasAttachments: !!response.data?.attachments,
      });

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send Chatwoot message';
      const errorDetails = error.response?.data;

      console.error('❌ Chatwoot API Error:', {
        message: errorMessage,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: errorDetails,
        fullError: error.response?.data,
        requestPayload: {
          hasAttachments: !!attachments,
          attachmentCount: attachments?.length || 0,
          attachmentStructure: attachments?.[0],
        },
      });
      throw new AppError(`Chatwoot API Error: ${errorMessage}`, error.response?.status || 500);
    }
  },

  /**
   * Sync conversations from Chatwoot to local database
   */
  async syncChatwootConversations(
    accountId: string,
    inboxId: string,
    accessToken: string,
    baseUrl?: string | null
  ) {
    try {
      // Fetch conversations from Chatwoot
      const chatwootConversations = await this.getChatwootConversations(
        accountId,
        inboxId,
        accessToken,
        baseUrl
      );

      let syncedCount = 0;
      let createdCount = 0;
      let updatedCount = 0;

      for (const chatwootConv of chatwootConversations) {
        // Find or create conversation in database
        // Store Chatwoot conversation ID in externalUserId format: chatwoot_contactId_conversationId
        const externalUserId = `chatwoot_${chatwootConv.contact.id}_${chatwootConv.id}`;

        // First try to find by exact match (new format)
        let conversation = await prisma.socialConversation.findFirst({
          where: {
            platform: SocialPlatform.chatwoot,
            externalUserId: externalUserId,
          },
        });

        // If not found, try old format (chatwoot_contactId) for backward compatibility
        if (!conversation) {
          const oldFormatUserId = `chatwoot_${chatwootConv.contact.id}`;
          conversation = await prisma.socialConversation.findFirst({
            where: {
              platform: SocialPlatform.chatwoot,
              externalUserId: oldFormatUserId,
            },
          });
        }

        const lastMessageAt = chatwootConv.last_activity_at
          ? new Date(chatwootConv.last_activity_at)
          : new Date();

        const status = chatwootConv.status === 'open'
          ? ConversationStatus.Open
          : ConversationStatus.Closed;

        if (!conversation) {
          // Get companyId from integration - we need to find the integration first
          const integration = await prisma.integration.findFirst({
            where: {
              provider: 'chatwoot',
              accountId: accountId.toString(),
              pageId: inboxId,
              isActive: true,
            },
          });

          if (!integration) {
            console.error(`No active Chatwoot integration found for account ${accountId}, inbox ${inboxId}`);
            continue;
          }

          // Create new conversation
          conversation = await prisma.socialConversation.create({
            data: {
              companyId: integration.companyId,
              platform: SocialPlatform.chatwoot,
              externalUserId: externalUserId,
              externalUserName: chatwootConv.contact.name || chatwootConv.contact.identifier,
              status: status,
              lastMessageAt: lastMessageAt,
            },
          });
          createdCount++;
          console.log(`Created new conversation: ${conversation.id} for contact ${chatwootConv.contact.id}, Chatwoot conversation ${chatwootConv.id}`);
        } else {
          // Update existing conversation - also update externalUserId to include conversation ID
          await prisma.socialConversation.update({
            where: { id: conversation.id },
            data: {
              externalUserId: externalUserId, // Update to include conversation ID
              externalUserName: chatwootConv.contact.name || chatwootConv.contact.identifier,
              status: status,
              lastMessageAt: lastMessageAt,
            },
          });
          updatedCount++;
        }

        // Sync messages for this conversation
        try {
          const messages = await this.getChatwootMessages(
            accountId,
            chatwootConv.id,
            accessToken,
            baseUrl
          );

          for (const msg of messages) {
            // Check if message already exists (by checking if we have a message with similar timestamp)
            const messageTime = new Date(msg.created_at * 1000); // Chatwoot sends timestamp in seconds

            const existingMessage = await prisma.socialMessage.findFirst({
              where: {
                conversationId: conversation.id,
                content: msg.content,
                createdAt: {
                  gte: new Date(messageTime.getTime() - 1000), // 1 second tolerance
                  lte: new Date(messageTime.getTime() + 1000),
                },
              },
            });

            if (!existingMessage) {
              // Determine sender type
              const senderType = msg.message_type === 0 || msg.sender?.type === 'contact'
                ? SenderType.customer
                : SenderType.agent;

              await prisma.socialMessage.create({
                data: {
                  conversationId: conversation.id,
                  senderType: senderType,
                  content: msg.content,
                  createdAt: messageTime,
                },
              });
            }
          }
        } catch (error: any) {
          console.error(`Error syncing messages for conversation ${chatwootConv.id}:`, error.message);
          // Continue with next conversation
        }

        syncedCount++;
      }

      return {
        success: true,
        synced: syncedCount,
        created: createdCount,
        updated: updatedCount,
      };
    } catch (error: any) {
      console.error('Error syncing Chatwoot conversations:', error);
      throw error;
    }
  },

  /**
   * Process Chatwoot webhook event
   * Handles message_created events and automatically syncs to local database
   */
  async processChatwootWebhook(payload: any) {
    const logPrefix = '[Chatwoot Webhook]';
    console.log(`${logPrefix} ========== Webhook Processing Started ==========`);
    console.log(`${logPrefix} Full payload:`, JSON.stringify(payload, null, 2));

    // Chatwoot sends events like: { event: 'message_created', ... }
    const eventType = payload.event || 'unknown';
    console.log(`${logPrefix} Event type: ${eventType}`);

    if (payload.event !== 'message_created') {
      console.log(`${logPrefix} ⏭️  Skipping non-message event: ${payload.event}`);
      return { success: true, message: 'Event not processed' };
    }

    try {
      // Extract data from webhook payload
      const accountId = payload.account?.id;
      const conversationId = payload.conversation?.id;

      console.log(`${logPrefix} 📋 Extracted data:`, {
        accountId,
        conversationId,
        hasAccount: !!payload.account,
        hasConversation: !!payload.conversation,
        hasContact: !!payload.contact,
      });

      // Contact ID can be in multiple places depending on Chatwoot version
      // Check message object first (for message_created events)
      const messageObj = payload.conversation?.messages?.[0] || payload;
      const contactId = payload.contact?.id
        || payload.conversation?.contact_inbox?.contact_id
        || messageObj.sender_id
        || payload.sender_id; // Sometimes sender_id is the contact ID

      const contactName = payload.contact?.name
        || payload.contact?.identifier
        || payload.conversation?.meta?.sender?.name
        || `Contact ${contactId}`;

      const messageContent = payload.content || messageObj.content || '';

      // message_type can be number (0=incoming, 1=outgoing) or string ('incoming'/'outgoing')
      // Also check sender_type field which can be "Contact" or "User"
      const rawMessageType = payload.message_type ?? messageObj.message_type;
      const messageType = typeof rawMessageType === 'number'
        ? (rawMessageType === 0 ? 'incoming' : 'outgoing')
        : (rawMessageType || (messageObj.sender_type === 'Contact' ? 'incoming' : 'outgoing'));

      // created_at can be timestamp in seconds or ISO string
      const rawCreatedAt = payload.created_at || messageObj.created_at || messageObj.created_at;
      const createdAt = rawCreatedAt
        ? (typeof rawCreatedAt === 'number'
          ? new Date(rawCreatedAt * 1000)
          : new Date(rawCreatedAt))
        : new Date();

      // Check for attachments in payload (before processing)
      const hasAttachments = !!(payload.attachments || payload.conversation?.messages?.[0]?.attachments || messageObj.attachments);

      // Validate: must have either content or attachments
      if (!accountId || !conversationId || !contactId || (!messageContent && !hasAttachments)) {
        console.error(`${logPrefix} ❌ Missing required fields:`, {
          accountId: accountId || 'MISSING',
          conversationId: conversationId || 'MISSING',
          contactId: contactId || 'MISSING',
          messageContent: messageContent ? 'present' : 'MISSING',
          hasAttachments,
          payloadKeys: Object.keys(payload),
          payloadStructure: {
            hasAccount: !!payload.account,
            hasConversation: !!payload.conversation,
            hasContact: !!payload.contact,
            hasContent: !!payload.content,
            hasAttachments: !!(payload.attachments || payload.conversation?.messages?.[0]?.attachments),
          },
        });
        return { success: false, message: 'Missing required fields in webhook payload (need content or image)' };
      }

      console.log(`${logPrefix} ✅ All required fields present`);

      // Find the integration for this account
      console.log(`${logPrefix} 🔍 Looking for integration with accountId: ${accountId}`);
      const integration = await prisma.integration.findFirst({
        where: {
          provider: 'chatwoot',
          accountId: accountId.toString(),
          isActive: true,
        },
      });

      if (!integration) {
        console.error(`${logPrefix} ❌ No active Chatwoot integration found for account ${accountId}`);
        console.error(`${logPrefix} Available integrations:`, await prisma.integration.findMany({
          where: { provider: 'chatwoot' },
          select: { id: true, accountId: true, isActive: true, companyId: true },
        }));
        return { success: false, message: `Integration not found for account ${accountId}` };
      }

      console.log(`${logPrefix} ✅ Found integration:`, {
        id: integration.id,
        accountId: integration.accountId,
        companyId: integration.companyId,
        isActive: integration.isActive,
        isWebhookActive: integration.isWebhookActive,
      });

      // Check if webhook is active for this integration
      if (!integration.isWebhookActive) {
        console.warn(`${logPrefix} ⚠️  Webhook is not active for integration ${integration.id}`);
        console.warn(`${logPrefix} To enable: Update integration with isWebhookActive = true`);
        return { success: true, message: 'Webhook disabled for this integration' };
      }

      console.log(`${logPrefix} ✅ Webhook is active for integration ${integration.id}`);

      // Handle image attachments (after integration is fetched)
      let imageUrl: string | null = null;
      const attachments = payload.attachments || payload.conversation?.messages?.[0]?.attachments || messageObj.attachments;
      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        // Find image attachment
        const imageAttachment = attachments.find((att: any) =>
          att.type === 'image' || att.file_type === 'image' || att.content_type?.startsWith('image/')
        );

        if (imageAttachment) {
          try {
            // Download image from Chatwoot
            const imageUrlFromChatwoot = imageAttachment.data_url || imageAttachment.url || imageAttachment.file_url;
            if (imageUrlFromChatwoot) {
              console.log(`${logPrefix} 📷 Found image attachment: ${imageUrlFromChatwoot}`);

              // Download image
              const response = await axios.get(imageUrlFromChatwoot, {
                responseType: 'arraybuffer',
                headers: {
                  'api_access_token': integration.accessToken,
                },
              });

              // Save to local storage
              const socialUploadsDir = path.join(process.cwd(), 'uploads', 'social');
              if (!fs.existsSync(socialUploadsDir)) {
                fs.mkdirSync(socialUploadsDir, { recursive: true });
              }

              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
              const ext = path.extname(imageUrlFromChatwoot) || '.jpg';
              const filename = `chatwoot-${uniqueSuffix}${ext}`;
              const filePath = path.join(socialUploadsDir, filename);

              fs.writeFileSync(filePath, response.data);
              imageUrl = `/uploads/social/${filename}`;
              console.log(`${logPrefix} ✅ Saved image to: ${imageUrl}`);
            }
          } catch (imageError: any) {
            console.error(`${logPrefix} ❌ Error downloading/saving image:`, imageError.message);
            // Continue without image - don't fail the whole message
          }
        }
      }

      // Find or create conversation
      // Store Chatwoot conversation ID in externalUserId format: chatwoot_contactId_conversationId
      // This allows us to retrieve the Chatwoot conversation ID when sending replies
      const externalUserId = `chatwoot_${contactId}_${conversationId}`;

      console.log(`${logPrefix} 🔍 Looking for conversation with externalUserId: ${externalUserId}`);

      // First try to find by exact match (new format)
      let conversation = await prisma.socialConversation.findFirst({
        where: {
          platform: SocialPlatform.chatwoot,
          externalUserId: externalUserId,
          companyId: integration.companyId, // Add companyId filter
        },
      });

      // If not found, try old format (chatwoot_contactId) for backward compatibility
      if (!conversation) {
        console.log(`${logPrefix} 🔍 Trying old format: chatwoot_${contactId}`);
        const oldFormatUserId = `chatwoot_${contactId}`;
        conversation = await prisma.socialConversation.findFirst({
          where: {
            platform: SocialPlatform.chatwoot,
            externalUserId: oldFormatUserId,
            companyId: integration.companyId, // Add companyId filter
          },
        });
      }

      if (!conversation) {
        // Create new conversation
        console.log(`${logPrefix} ➕ Creating new conversation for companyId: ${integration.companyId}`);
        try {
          conversation = await prisma.socialConversation.create({
            data: {
              companyId: integration.companyId,
              platform: SocialPlatform.chatwoot,
              externalUserId: externalUserId,
              externalUserName: contactName || `Contact ${contactId}`,
              status: ConversationStatus.Open,
              lastMessageAt: createdAt,
            },
          });
          console.log(`${logPrefix} ✅ Created new conversation ID: ${conversation.id} for contact ${contactId}, Chatwoot conversation ${conversationId}`);
        } catch (createError: any) {
          console.error(`${logPrefix} ❌ Error creating conversation:`, createError);
          if (createError.code === 'P2003') {
            console.error(`${logPrefix} ❌ Foreign key constraint failed - companyId ${integration.companyId} may not exist in companies table`);
          }
          throw createError;
        }
      } else {
        // Update existing conversation - also update externalUserId if conversation ID changed
        console.log(`${logPrefix} 🔄 Updating existing conversation ID: ${conversation.id}`);
        await prisma.socialConversation.update({
          where: { id: conversation.id },
          data: {
            externalUserId: externalUserId, // Update to include conversation ID
            externalUserName: contactName || conversation.externalUserName,
            lastMessageAt: createdAt,
            status: ConversationStatus.Open, // Reopen if closed
          },
        });
        console.log(`${logPrefix} ✅ Updated conversation ID: ${conversation.id}`);
      }

      // Check if message already exists (avoid duplicates)
      console.log(`${logPrefix} 🔍 Checking for duplicate message`);
      const existingMessage = await prisma.socialMessage.findFirst({
        where: {
          conversationId: conversation.id,
          content: messageContent,
          createdAt: {
            gte: new Date(createdAt.getTime() - 1000), // 1 second tolerance
            lte: new Date(createdAt.getTime() + 1000),
          },
        },
      });

      if (!existingMessage) {
        // Determine sender type
        // Check multiple sources: messageType, sender.type, sender_type field
        const messageObj = payload.conversation?.messages?.[0] || payload;
        const isIncoming = messageType === 'incoming'
          || payload.sender?.type === 'contact'
          || messageObj.sender_type === 'Contact'
          || (typeof payload.message_type === 'number' && payload.message_type === 0)
          || (typeof messageObj.message_type === 'number' && messageObj.message_type === 0);

        const senderType = isIncoming ? SenderType.customer : SenderType.agent;

        console.log(`${logPrefix} 💬 Saving message:`, {
          conversationId: conversation.id,
          senderType,
          contentLength: messageContent.length,
          isIncoming,
          messageType,
        });

        // Save message
        try {
          const message = await prisma.socialMessage.create({
            data: {
              conversationId: conversation.id,
              senderType: senderType,
              content: messageContent || '', // Allow empty content if only image
              imageUrl: imageUrl || null,
              createdAt: createdAt,
            },
          });
          console.log(`${logPrefix} ✅ Saved message ID: ${message.id} in conversation ${conversation.id}`);
          
          // If customer message, mark all unseen agent messages as seen (customer replied, so they saw the messages)
          if (senderType === SenderType.customer) {
            const now = new Date();
            const seenUpdate = await prisma.socialMessage.updateMany({
              where: {
                conversationId: conversation.id,
                senderType: SenderType.agent,
                isSeen: false,
              },
              data: {
                isSeen: true,
                seenAt: now,
              },
            });
            if (seenUpdate.count > 0) {
              console.log(`${logPrefix} ✅ Marked ${seenUpdate.count} agent messages as seen`);
            }
          }
          
          console.log(`${logPrefix} ========== Webhook Processing Complete ==========`);
        } catch (messageError: any) {
          console.error(`${logPrefix} ❌ Error saving message:`, messageError);
          console.error(`${logPrefix} Message data:`, {
            conversationId: conversation.id,
            senderType,
            content: messageContent.substring(0, 100),
            createdAt,
          });
          throw messageError;
        }
      } else {
        console.log(`${logPrefix} ⏭️  Message already exists (duplicate), skipping. Existing message ID: ${existingMessage.id}`);
      }

      return {
        success: true,
        message: 'Webhook processed successfully',
        conversationId: conversation.id,
        messageSaved: !existingMessage,
      };
    } catch (error: any) {
      console.error(`${logPrefix} ❌ ========== Error processing Chatwoot webhook ==========`);
      console.error(`${logPrefix} Error type:`, error.constructor.name);
      console.error(`${logPrefix} Error message:`, error.message);
      console.error(`${logPrefix} Error stack:`, error.stack);
      console.error(`${logPrefix} Payload keys:`, Object.keys(payload));
      console.error(`${logPrefix} ==========================================`);
      throw new AppError(`Webhook processing error: ${error.message}`, 500);
    }
  },
};

