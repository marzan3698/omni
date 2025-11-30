import axios from 'axios';
import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';
import { SocialPlatform, ConversationStatus, SenderType } from '@prisma/client';

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
    baseUrl?: string | null
  ): Promise<ChatwootMessage> {
    try {
      const apiUrl = getChatwootApiUrl(baseUrl);
      const url = `${apiUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;
      
      const response = await axios.post(
        url,
        {
          content: content,
          message_type: 'outgoing', // Agent message
          private: false,
        },
        {
          headers: getChatwootHeaders(accessToken),
        }
      );

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send Chatwoot message';
      console.error('Chatwoot API Error:', errorMessage);
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
    console.log('Received Chatwoot webhook payload:', JSON.stringify(payload, null, 2));

    // Chatwoot sends events like: { event: 'message_created', ... }
    if (payload.event !== 'message_created') {
      console.log(`Skipping non-message event: ${payload.event}`);
      return { success: true, message: 'Event not processed' };
    }

    try {
      // Extract data from webhook payload
      const accountId = payload.account?.id;
      const conversationId = payload.conversation?.id;
      
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
      
      const messageContent = payload.content || messageObj.content;
      
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

      if (!accountId || !conversationId || !contactId || !messageContent) {
        console.log('Missing required fields in webhook payload:', {
          accountId,
          conversationId,
          contactId,
          messageContent: messageContent ? 'present' : 'missing',
          payloadKeys: Object.keys(payload),
        });
        return { success: false, message: 'Missing required fields' };
      }

      // Find the integration for this account
      const integration = await prisma.integration.findFirst({
        where: {
          provider: 'chatwoot',
          accountId: accountId.toString(),
          isActive: true,
        },
      });

      if (!integration) {
        console.log(`No active Chatwoot integration found for account ${accountId}`);
        return { success: false, message: 'Integration not found' };
      }

      // Check if webhook is active for this integration
      if (!integration.isWebhookActive) {
        console.log(`Webhook is not active for integration ${integration.id}`);
        return { success: true, message: 'Webhook disabled for this integration' };
      }

      // Find or create conversation
      // Store Chatwoot conversation ID in externalUserId format: chatwoot_contactId_conversationId
      // This allows us to retrieve the Chatwoot conversation ID when sending replies
      const externalUserId = `chatwoot_${contactId}_${conversationId}`;
      
      // First try to find by exact match (new format)
      let conversation = await prisma.socialConversation.findFirst({
        where: {
          platform: SocialPlatform.chatwoot,
          externalUserId: externalUserId,
        },
      });
      
      // If not found, try old format (chatwoot_contactId) for backward compatibility
      if (!conversation) {
        const oldFormatUserId = `chatwoot_${contactId}`;
        conversation = await prisma.socialConversation.findFirst({
          where: {
            platform: SocialPlatform.chatwoot,
            externalUserId: oldFormatUserId,
          },
        });
      }

      if (!conversation) {
        // Create new conversation
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
        console.log(`Created new conversation: ${conversation.id} for contact ${contactId}, Chatwoot conversation ${conversationId}`);
      } else {
        // Update existing conversation - also update externalUserId if conversation ID changed
        await prisma.socialConversation.update({
          where: { id: conversation.id },
          data: {
            externalUserId: externalUserId, // Update to include conversation ID
            externalUserName: contactName || conversation.externalUserName,
            lastMessageAt: createdAt,
            status: ConversationStatus.Open, // Reopen if closed
          },
        });
        console.log(`Updated conversation: ${conversation.id}`);
      }

      // Check if message already exists (avoid duplicates)
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

        // Save message
        const message = await prisma.socialMessage.create({
          data: {
            conversationId: conversation.id,
            senderType: senderType,
            content: messageContent,
            createdAt: createdAt,
          },
        });
        console.log(`✅ Saved message ID: ${message.id} in conversation ${conversation.id}`);
      } else {
        console.log(`Message already exists, skipping duplicate`);
      }

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error: any) {
      console.error('Error processing Chatwoot webhook:', error);
      throw new AppError(`Webhook processing error: ${error.message}`, 500);
    }
  },
};

