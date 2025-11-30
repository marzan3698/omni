import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { chatwootService } from './chatwoot.service.js';

interface FacebookWebhookEntry {
  id: string;
  time: number;
  messaging?: Array<{
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message?: {
      mid: string;
      text?: string;
      attachments?: Array<{
        type: string;
        payload?: {
          url?: string;
        };
      }>;
      sticker_id?: number;
      quick_reply?: {
        payload: string;
      };
    };
    postback?: any;
    delivery?: any;
    read?: any;
  }>;
}

interface FacebookWebhookPayload {
  object?: string;
  entry?: FacebookWebhookEntry[];
  // Test webhook format
  field?: string;
  value?: {
    sender: { id: string };
    recipient: { id: string };
    timestamp: string | number;
    message?: {
      mid: string;
      text: string;
      commands?: Array<{ name: string }>;
    };
  };
}

export const socialService = {
  /**
   * Verify Facebook webhook
   * Facebook sends a GET request with hub.mode, hub.verify_token, and hub.challenge
   */
  verifyWebhook(verifyToken: string, challenge: string, mode: string): string {
    const expectedToken = process.env.FACEBOOK_VERIFY_TOKEN || 'your_verify_token_here';

    if (mode === 'subscribe' && verifyToken === expectedToken) {
      return challenge;
    }

    throw new AppError('Invalid verification token', 403);
  },

  /**
   * Process incoming Facebook messages
   * Handles both production format (object: 'page') and test format (field: 'messages')
   */
  async processFacebookMessage(payload: FacebookWebhookPayload) {
    console.log('Received webhook payload:', JSON.stringify(payload, null, 2));

    // Handle test webhook format (from Facebook dashboard test button)
    if (payload.field === 'messages' && payload.value) {
      const value = payload.value;
      if (!value.message || !value.message.text) {
        console.log('Test webhook: No message text, skipping');
        return { success: true };
      }

      const senderId = value.sender.id;
      const messageText = value.message.text;
      // Convert timestamp (can be string or number in seconds)
      // For test webhooks, Facebook sends old timestamps, so use current time
      let timestampMs = typeof value.timestamp === 'string' 
        ? parseInt(value.timestamp) * 1000 
        : value.timestamp * 1000;
      
      // If timestamp is too old (before 2020), use current time for test messages
      const timestampDate = new Date(timestampMs);
      const year2020 = new Date('2020-01-01').getTime();
      if (timestampMs < year2020) {
        console.log('Test webhook: Using current timestamp instead of old test timestamp');
        timestampMs = Date.now();
      }
      
      const timestamp = new Date(timestampMs);

      console.log(`Processing test message from ${senderId}: ${messageText}`);

      // Find or create conversation
      let conversation = await prisma.socialConversation.findFirst({
        where: {
          platform: 'facebook',
          externalUserId: senderId,
        },
      });

      if (!conversation) {
        conversation = await prisma.socialConversation.create({
          data: {
            platform: 'facebook',
            externalUserId: senderId,
            externalUserName: `Test User ${senderId.substring(0, 8)}`,
            status: 'Open',
            lastMessageAt: timestamp,
          },
        });
        console.log(`Created new conversation: ${conversation.id}`);
      } else {
        await prisma.socialConversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: timestamp,
            status: 'Open',
          },
        });
        console.log(`Updated conversation: ${conversation.id}`);
      }

      // Save message
      const message = await prisma.socialMessage.create({
        data: {
          conversationId: conversation.id,
          senderType: 'customer',
          content: messageText,
          createdAt: timestamp,
        },
      });
      console.log(`Saved message: ${message.id}`);
      return { success: true };
    }

    // Handle production webhook format (object: 'page')
    if (payload.object !== 'page' || !payload.entry) {
      console.log('Invalid webhook format or not a page object');
      throw new AppError('Invalid webhook object', 400);
    }

    for (const entry of payload.entry) {
      // Process messaging events
      if (entry.messaging && Array.isArray(entry.messaging)) {
        for (const event of entry.messaging) {
          // Skip if not a message event
          if (!event.message) {
            console.log('Skipping non-message event:', event);
            continue;
          }

          const senderId = event.sender.id;
          const recipientId = event.recipient.id;
          
          // Convert timestamp (Facebook sends in seconds, JavaScript Date needs milliseconds)
          const timestamp = new Date(event.timestamp * 1000);

          // Handle different message types
          let messageContent = '';
          if (event.message.text) {
            messageContent = event.message.text;
          } else if (event.message.attachments && event.message.attachments.length > 0) {
            // Handle attachments (images, videos, etc.)
            const attachment = event.message.attachments[0];
            messageContent = `[${attachment.type}] ${attachment.type === 'image' ? 'Image' : attachment.type === 'video' ? 'Video' : attachment.type === 'audio' ? 'Audio' : 'File'} attachment`;
            if (attachment.payload && attachment.payload.url) {
              messageContent += `: ${attachment.payload.url}`;
            }
          } else if (event.message.sticker_id) {
            messageContent = '[Sticker]';
          } else if (event.message.quick_reply && event.message.quick_reply.payload) {
            messageContent = `[Quick Reply] ${event.message.quick_reply.payload}`;
          } else {
            // Unknown message type, log it but still save
            messageContent = '[Message]';
            console.log('Unknown message type:', JSON.stringify(event.message, null, 2));
          }

          // Skip if no content at all
          if (!messageContent) {
            console.log('Skipping message with no content');
            continue;
          }

          console.log(`Processing message from ${senderId} to ${recipientId}: ${messageContent.substring(0, 50)}`);

          // Find or create conversation
          let conversation = await prisma.socialConversation.findFirst({
            where: {
              platform: 'facebook',
              externalUserId: senderId,
            },
          });

          if (!conversation) {
            conversation = await prisma.socialConversation.create({
              data: {
                platform: 'facebook',
                externalUserId: senderId,
                externalUserName: null, // Would be fetched from Facebook API
                status: 'Open',
                lastMessageAt: timestamp,
              },
            });
            console.log(`Created new conversation: ${conversation.id} for user ${senderId}`);
          } else {
            await prisma.socialConversation.update({
              where: { id: conversation.id },
              data: {
                lastMessageAt: timestamp,
                status: 'Open', // Reopen if closed
              },
            });
            console.log(`Updated conversation: ${conversation.id}`);
          }

          // Save message
          const message = await prisma.socialMessage.create({
            data: {
              conversationId: conversation.id,
              senderType: 'customer',
              content: messageContent,
              createdAt: timestamp,
            },
          });
          console.log(`✅ Saved message ID: ${message.id} in conversation ${conversation.id}`);
        }
      } else {
        console.log('Entry has no messaging array:', JSON.stringify(entry, null, 2));
      }
    }

    return { success: true };
  },

  /**
   * Get all conversations
   */
  async getConversations(status?: 'Open' | 'Closed', companyId?: number) {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (companyId) {
      where.companyId = companyId;
    }

    const conversations = await prisma.socialConversation.findMany({
      where,
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Get last message for preview
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });

    return conversations;
  },

  /**
   * Get messages for a specific conversation
   */
  async getConversationMessages(conversationId: number) {
    const conversation = await prisma.socialConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    return conversation;
  },

  /**
   * Send a reply message (agent response)
   */
  async sendReply(conversationId: number, content: string, agentId: string) {
    // Verify conversation exists
    const conversation = await prisma.socialConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // If Chatwoot platform, send via Chatwoot API
    if (conversation.platform === 'chatwoot') {
      // Get Chatwoot integration
      const integration = await prisma.integration.findFirst({
        where: {
          provider: 'chatwoot',
          isActive: true,
        },
      });

      if (!integration || !integration.accountId) {
        throw new AppError('Chatwoot integration not found or not configured', 400);
      }

      // Extract Chatwoot conversation ID from externalUserId
      // New format: chatwoot_contactId_conversationId
      // Old format: chatwoot_contactId (need to find conversation ID from Chatwoot API)
      let chatwootConversationId: number | null = null;
      const conversationIdMatch = conversation.externalUserId.match(/chatwoot_\d+_(\d+)/);
      
      if (conversationIdMatch) {
        // New format - extract conversation ID directly
        chatwootConversationId = parseInt(conversationIdMatch[1], 10);
      } else {
        // Old format - need to find conversation ID from Chatwoot API
        const contactIdMatch = conversation.externalUserId.match(/chatwoot_(\d+)/);
        if (contactIdMatch) {
          const contactId = contactIdMatch[1];
          console.log(`Old format detected. Finding conversation for contact ${contactId}...`);
          
          // Import chatwootService
          const { chatwootService } = await import('./chatwoot.service.js');
          
          // Get inbox ID from integration (pageId stores inboxId for Chatwoot)
          const inboxId = integration.pageId;
          if (!inboxId) {
            throw new AppError('Chatwoot inbox ID not configured', 400);
          }
          
          // Fetch conversations from Chatwoot to find the one for this contact
          try {
            const chatwootConversations = await chatwootService.getChatwootConversations(
              integration.accountId,
              inboxId,
              integration.accessToken,
              integration.baseUrl
            );
            
            // Find conversation for this contact
            console.log(`Searching ${chatwootConversations.length} conversations for contact ${contactId}`);
            const chatwootConv = chatwootConversations.find(
              conv => conv.contact.id.toString() === contactId
            );
            
            if (chatwootConv) {
              chatwootConversationId = chatwootConv.id;
              console.log(`✅ Found Chatwoot conversation ID: ${chatwootConversationId} for contact ${contactId}`);
              
              // Update conversation to new format for future use
              await prisma.socialConversation.update({
                where: { id: conversation.id },
                data: {
                  externalUserId: `chatwoot_${contactId}_${chatwootConversationId}`,
                },
              });
            } else {
              console.log(`❌ Conversation not found for contact ${contactId}. Available contacts:`, 
                chatwootConversations.map(c => `${c.contact.id} (${c.contact.name})`).join(', '));
              
              // Fallback: Try to get conversation ID from Chatwoot API directly by contact ID
              // This might work if the conversation exists but wasn't returned in the list
              try {
                const axios = (await import('axios')).default;
                const getChatwootApiUrl = (baseUrl?: string | null): string => {
                  const defaultUrl = 'https://app.chatwoot.com';
                  if (!baseUrl) return defaultUrl;
                  const url = baseUrl.trim().replace(/\/$/, '');
                  return url || defaultUrl;
                };
                
                const apiUrl = getChatwootApiUrl(integration.baseUrl);
                // Try to get conversations directly with contact_id filter
                const convUrl = `${apiUrl}/api/v1/accounts/${integration.accountId}/conversations`;
                const convResponse = await axios.get(convUrl, {
                  headers: {
                    'api_access_token': integration.accessToken,
                    'Content-Type': 'application/json',
                  },
                  params: {
                    inbox_id: integration.pageId,
                    contact_id: contactId,
                  },
                });
                
                if (convResponse.data?.payload && convResponse.data.payload.length > 0) {
                  const conv = convResponse.data.payload[0];
                  chatwootConversationId = conv.id;
                  console.log(`✅ Found Chatwoot conversation ID via direct API call: ${chatwootConversationId}`);
                  
                  // Update conversation to new format
                  await prisma.socialConversation.update({
                    where: { id: conversation.id },
                    data: {
                      externalUserId: `chatwoot_${contactId}_${chatwootConversationId}`,
                    },
                  });
                }
              } catch (fallbackError: any) {
                console.error('Fallback API call failed:', fallbackError.message);
              }
              
              if (!chatwootConversationId) {
                // Last resort: Try to get conversation ID from webhook payload stored in logs
                // Or check if we can create a new conversation
                console.log(`⚠️ Could not find Chatwoot conversation ID for contact ${contactId}. The conversation may need to be updated via webhook.`);
                throw new AppError(`Chatwoot conversation not found for contact ${contactId}. Please send a new message from Chatwoot to this contact to update the conversation format, or wait for the next webhook.`, 404);
              }
            }
          } catch (error: any) {
            console.error('Error fetching Chatwoot conversations:', error);
            throw new AppError(`Failed to find Chatwoot conversation: ${error.message}`, 500);
          }
        }
      }
      
      if (!chatwootConversationId || isNaN(chatwootConversationId)) {
        throw new AppError('Chatwoot conversation ID not found. Please sync conversations first.', 400);
      }

      // Import chatwootService
      const { chatwootService } = await import('./chatwoot.service.js');

      // Send message via Chatwoot API first
      let chatwootMessage;
      try {
        chatwootMessage = await chatwootService.sendChatwootMessage(
          integration.accountId,
          chatwootConversationId,
          content,
          integration.accessToken,
          integration.baseUrl
        );
        console.log(`✅ Message sent to Chatwoot conversation ${chatwootConversationId}`);
      } catch (error: any) {
        console.error('Error sending Chatwoot message via API:', error);
        throw new AppError(`Failed to send message to Chatwoot: ${error.message}`, error.statusCode || 500);
      }

      // Save agent message locally after successful API send
      const message = await prisma.socialMessage.create({
        data: {
          conversationId,
          senderType: 'agent',
          content,
          createdAt: new Date(),
        },
      });

      // Update conversation last message time
      await prisma.socialConversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
        },
      });

      return message;
    }

    // For Facebook and other platforms, save locally only
    // Save agent message
    const message = await prisma.socialMessage.create({
      data: {
        conversationId,
        senderType: 'agent',
        content,
        createdAt: new Date(),
      },
    });

    // Update conversation last message time
    await prisma.socialConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
      },
    });

    return message;
  },

  /**
   * Sync Chatwoot conversations
   */
  async syncChatwootConversations() {
    // Get all active Chatwoot integrations
    const integrations = await prisma.integration.findMany({
      where: {
        provider: 'chatwoot',
        isActive: true,
      },
    });

    if (integrations.length === 0) {
      return {
        success: true,
        message: 'No active Chatwoot integrations found',
        synced: 0,
      };
    }

    const results = [];
    for (const integration of integrations) {
      if (!integration.accountId) {
        console.warn(`Chatwoot integration ${integration.id} missing accountId, skipping`);
        continue;
      }

      try {
        const result = await chatwootService.syncChatwootConversations(
          integration.accountId,
          integration.pageId, // inboxId
          integration.accessToken,
          integration.baseUrl
        );
        results.push({
          integrationId: integration.id,
          ...result,
        });
      } catch (error: any) {
        console.error(`Error syncing Chatwoot integration ${integration.id}:`, error);
        results.push({
          integrationId: integration.id,
          success: false,
          error: error.message,
        });
      }
    }

    const totalSynced = results.reduce((sum, r) => sum + (r.synced || 0), 0);
    const totalCreated = results.reduce((sum, r) => sum + (r.created || 0), 0);
    const totalUpdated = results.reduce((sum, r) => sum + (r.updated || 0), 0);

    return {
      success: true,
      message: `Synced ${totalSynced} conversations (${totalCreated} created, ${totalUpdated} updated)`,
      results,
      totalSynced,
      totalCreated,
      totalUpdated,
    };
  },
};

