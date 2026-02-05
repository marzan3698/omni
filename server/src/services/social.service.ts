import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { chatwootService } from './chatwoot.service.js';

// In-memory storage for typing indicators
// Key: conversationId, Value: { userId: string, isTyping: boolean, updatedAt: Date }
const typingIndicators = new Map<number, { userId: string; isTyping: boolean; updatedAt: Date }>();

// Clean up old typing indicators (older than 5 seconds)
setInterval(() => {
  const now = new Date();
  for (const [conversationId, data] of typingIndicators.entries()) {
    const diffMs = now.getTime() - data.updatedAt.getTime();
    if (diffMs > 5000) {
      typingIndicators.delete(conversationId);
    }
  }
}, 3000); // Run cleanup every 3 seconds

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
          imageUrl: null, // Test webhook doesn't support images
          createdAt: timestamp,
        },
      });
      console.log(`Saved message: ${message.id}`);
      
      // Mark all unseen agent messages as seen (customer replied, so they saw the messages)
      const now = new Date();
      const seenUpdate = await prisma.socialMessage.updateMany({
        where: {
          conversationId: conversation.id,
          senderType: 'agent',
          isSeen: false,
        },
        data: {
          isSeen: true,
          seenAt: now,
        },
      });
      if (seenUpdate.count > 0) {
        console.log(`✅ Marked ${seenUpdate.count} agent messages as seen`);
      }
      
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
          let imageUrl: string | null = null;

          if (event.message.text) {
            messageContent = event.message.text;
          } else if (event.message.attachments && event.message.attachments.length > 0) {
            // Handle attachments (images, videos, etc.)
            const attachment = event.message.attachments[0];

            if (attachment.type === 'image' && attachment.payload && attachment.payload.url) {
              // Download and save image
              try {
                const axios = (await import('axios')).default;
                const fs = (await import('fs')).default;
                const path = (await import('path')).default;

                // Download image from Facebook CDN
                const response = await axios.get(attachment.payload.url, {
                  responseType: 'arraybuffer',
                  params: {
                    access_token: process.env.FACEBOOK_ACCESS_TOKEN, // May need page access token
                  },
                });

                // Save to local storage
                const socialUploadsDir = path.join(process.cwd(), 'uploads', 'social');
                if (!fs.existsSync(socialUploadsDir)) {
                  fs.mkdirSync(socialUploadsDir, { recursive: true });
                }

                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = '.jpg'; // Facebook images are usually JPG
                const filename = `facebook-${uniqueSuffix}${ext}`;
                const filePath = path.join(socialUploadsDir, filename);

                fs.writeFileSync(filePath, response.data);
                imageUrl = `/uploads/social/${filename}`;
                messageContent = '[Image]';
                console.log(`✅ Saved Facebook image to: ${imageUrl}`);
              } catch (imageError: any) {
                console.error('Error downloading/saving Facebook image:', imageError.message);
                // Fallback to URL in content
                messageContent = `[Image] ${attachment.payload.url}`;
              }
            } else {
              messageContent = `[${attachment.type}] ${attachment.type === 'image' ? 'Image' : attachment.type === 'video' ? 'Video' : attachment.type === 'audio' ? 'Audio' : 'File'} attachment`;
              if (attachment.payload && attachment.payload.url) {
                messageContent += `: ${attachment.payload.url}`;
              }
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
              imageUrl: imageUrl || null,
              createdAt: timestamp,
            },
          });
          console.log(`✅ Saved message ID: ${message.id} in conversation ${conversation.id}`);
          
          // Mark all unseen agent messages as seen (customer replied, so they saw the messages)
          const now = new Date();
          const seenUpdate = await prisma.socialMessage.updateMany({
            where: {
              conversationId: conversation.id,
              senderType: 'agent',
              isSeen: false,
            },
            data: {
              isSeen: true,
              seenAt: now,
            },
          });
          if (seenUpdate.count > 0) {
            console.log(`✅ Marked ${seenUpdate.count} agent messages as seen`);
          }
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
  async getConversations(status?: 'Open' | 'Closed', companyId?: number, tab?: 'inbox' | 'taken' | 'complete', assignedToEmployeeId?: number) {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (companyId) {
      where.companyId = companyId;
    }
    
    // Filter by assignment based on tab
    if (tab === 'inbox') {
      // Show only unassigned conversations
      where.assignedTo = null;
    } else if (tab === 'taken' && assignedToEmployeeId) {
      // Show only open conversations assigned to this employee
      where.assignedTo = assignedToEmployeeId;
      where.status = 'Open';
    } else if (tab === 'complete' && assignedToEmployeeId) {
      // Show only closed conversations assigned to this employee
      where.status = 'Closed';
      where.assignedTo = assignedToEmployeeId;
    }

    // Debug logging
    console.log('🔍 getConversations query:', {
      status,
      companyId,
      tab,
      assignedToEmployeeId,
      where,
    });

    const conversations = await prisma.socialConversation.findMany({
      where,
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Get last message for preview
        },
        assignedEmployee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        labels: true,
        _count: {
          select: {
            messages: true,
            releases: true, // Count of releases for this conversation
          },
        },
      },
      orderBy: [
        {
          lastMessageAt: 'desc',
        },
        {
          createdAt: 'desc', // Fallback to createdAt if lastMessageAt is null
        },
      ],
    });

    // Calculate unread count for each conversation
    const conversationsWithUnreadCount = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await prisma.socialMessage.count({
          where: {
            conversationId: conversation.id,
            senderType: 'customer',
            isRead: false,
          },
        });
        return {
          ...conversation,
          unreadCount,
        };
      })
    );

    // Debug logging
    console.log('✅ getConversations result:', {
      total: conversationsWithUnreadCount.length,
      platforms: conversationsWithUnreadCount.map(c => c.platform),
      chatwootCount: conversationsWithUnreadCount.filter(c => c.platform === 'chatwoot').length,
      facebookCount: conversationsWithUnreadCount.filter(c => c.platform === 'facebook').length,
    });

    return conversationsWithUnreadCount;
  },

  /**
   * Get conversation analytics (counts + daily trend)
   */
  async getConversationAnalytics(companyId?: number, days: number = 30) {
    const safeDays = Number.isFinite(days) && days > 0 && days <= 90 ? Math.floor(days) : 30;
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (safeDays - 1));

    const [statusCounts, platformCounts, messageGroups, conversationGroups] = await Promise.all([
      prisma.socialConversation.groupBy({
        by: ['status'],
        where: companyId ? { companyId } : undefined,
        _count: { _all: true },
      }),
      prisma.socialConversation.groupBy({
        by: ['platform'],
        where: companyId ? { companyId } : undefined,
        _count: { _all: true },
      }),
      prisma.socialMessage.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: startDate },
          conversation: companyId ? { companyId } : undefined,
        },
        _count: { _all: true },
      }),
      prisma.socialConversation.groupBy({
        by: ['createdAt'],
        where: {
          ...(companyId ? { companyId } : {}),
          createdAt: { gte: startDate },
        },
        _count: { _all: true },
      }),
    ]);

    const formatDateKey = (d: Date) => d.toISOString().slice(0, 10);

    const messageDailyMap = messageGroups.reduce<Record<string, number>>((acc, item) => {
      const key = formatDateKey(item.createdAt);
      acc[key] = (acc[key] || 0) + item._count._all;
      return acc;
    }, {});

    const conversationDailyMap = conversationGroups.reduce<Record<string, number>>((acc, item) => {
      const key = formatDateKey(item.createdAt);
      acc[key] = (acc[key] || 0) + item._count._all;
      return acc;
    }, {});

    const daily: Array<{ date: string; messages: number; conversations: number }> = [];
    for (let i = 0; i < safeDays; i++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);
      const key = formatDateKey(current);
      daily.push({
        date: key,
        messages: messageDailyMap[key] || 0,
        conversations: conversationDailyMap[key] || 0,
      });
    }

    const totalConversations = statusCounts.reduce((sum, s) => sum + s._count._all, 0);
    const openConversations = statusCounts.find((s) => s.status === 'Open')?._count._all || 0;
    const closedConversations = statusCounts.find((s) => s.status === 'Closed')?._count._all || 0;

    const platformBreakdown = {
      facebook: platformCounts.find((p) => p.platform === 'facebook')?._count._all || 0,
      chatwoot: platformCounts.find((p) => p.platform === 'chatwoot')?._count._all || 0,
      whatsapp: platformCounts.find((p) => p.platform === 'whatsapp')?._count._all || 0,
      other: platformCounts.reduce((sum, p) => {
        if (p.platform === 'facebook' || p.platform === 'chatwoot' || p.platform === 'whatsapp') return sum;
        return sum + p._count._all;
      }, 0),
    };

    return {
      totalConversations,
      openConversations,
      closedConversations,
      platformBreakdown,
      daily,
    };
  },

  /**
   * Get messages for a specific conversation
   */
  async getConversationMessages(conversationId: number, companyId?: number) {
    const where: any = { id: conversationId };
    if (companyId) {
      where.companyId = companyId;
    }

    const conversation = await prisma.socialConversation.findFirst({
      where,
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        labels: true,
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
  async sendReply(conversationId: number, content: string, agentId: string, imageUrl?: string | null) {
    console.log('🔵 sendReply called:', { conversationId, hasContent: !!content, hasImage: !!imageUrl, imageUrl });

    // Verify conversation exists
    const conversation = await prisma.socialConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      console.error('❌ Conversation not found:', conversationId);
      throw new AppError('Conversation not found', 404);
    }

    console.log('✅ Conversation found:', { id: conversation.id, platform: conversation.platform, externalUserId: conversation.externalUserId });

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
        // Prepare attachments if image is provided
        let attachments: Array<{ type: string; data_url: string }> | undefined;
        if (imageUrl) {
          try {
            // Chatwoot requires base64 data URL, not HTTP URL
            // Read the image file and convert to base64
            const fs = (await import('fs')).default;
            const path = (await import('path')).default;

            // Get the local file path
            const localFilePath = imageUrl.startsWith('/')
              ? path.join(process.cwd(), imageUrl)
              : path.join(process.cwd(), 'uploads', 'social', path.basename(imageUrl));

            console.log('📁 Reading image file:', localFilePath);

            // Check if file exists
            if (!fs.existsSync(localFilePath)) {
              throw new AppError(`Image file not found: ${localFilePath}`, 404);
            }

            // Read file and convert to base64
            const imageBuffer = fs.readFileSync(localFilePath);
            const base64Image = imageBuffer.toString('base64');

            // Determine MIME type from file extension
            const ext = path.extname(localFilePath).toLowerCase();
            const mimeTypes: Record<string, string> = {
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.png': 'image/png',
              '.gif': 'image/gif',
              '.webp': 'image/webp',
            };
            const mimeType = mimeTypes[ext] || 'image/png';

            // Create data URL format: data:image/png;base64,{base64String}
            const dataUrl = `data:${mimeType};base64,${base64Image}`;

            attachments = [{
              type: 'image',
              data_url: dataUrl,
            }];

            console.log(`✅ Image converted to base64 (${(imageBuffer.length / 1024).toFixed(2)}KB)`);
          } catch (imageError: any) {
            console.error('❌ Error processing image for Chatwoot:', imageError.message);
            throw new AppError(`Failed to process image: ${imageError.message}`, 500);
          }
        }

        console.log('📤 Calling Chatwoot API:', {
          accountId: integration.accountId,
          conversationId: chatwootConversationId,
          hasContent: !!content,
          hasAttachments: !!attachments,
          attachmentCount: attachments?.length || 0,
        });

        chatwootMessage = await chatwootService.sendChatwootMessage(
          integration.accountId,
          chatwootConversationId,
          content || '', // Chatwoot requires content, even if empty
          integration.accessToken,
          integration.baseUrl,
          attachments // Pass attachments
        );
        console.log(`✅ Message sent to Chatwoot conversation ${chatwootConversationId}`, {
          messageId: chatwootMessage?.id,
          hasAttachments: !!attachments,
        });
      } catch (error: any) {
        console.error('❌ Error sending Chatwoot message via API:', {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status,
          statusCode: error.statusCode,
        });
        throw new AppError(
          `Failed to send message to Chatwoot: ${error.response?.data?.error || error.message}`,
          error.response?.status || error.statusCode || 500
        );
      }

      // Save agent message locally after successful API send
      const message = await prisma.socialMessage.create({
        data: {
          conversationId,
          senderType: 'agent',
          content: content || '', // Allow empty content if only image
          imageUrl: imageUrl || null,
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

    // For WhatsApp platform, send via whatsapp-web.js client
    if (conversation.platform === 'whatsapp') {
      const { sendMessage, isValidSlotId } = await import('./whatsapp.service.js');
      const text = content?.trim() || (imageUrl ? '[Image]' : '');
      if (!text) {
        throw new AppError('Message content or image is required', 400);
      }
      const slotId = conversation.whatsappSlotId && isValidSlotId(conversation.whatsappSlotId)
        ? conversation.whatsappSlotId
        : '1';
      const result = await sendMessage(conversation.companyId, slotId, conversation.externalUserId, text);
      if (!result.success) {
        throw new AppError(result.error || 'Failed to send WhatsApp message', 400);
      }
    }

    // For Facebook platform, send via Facebook Messenger API
    console.log('🔍 Checking conversation platform:', {
      conversationId: conversation.id,
      platform: conversation.platform,
      externalUserId: conversation.externalUserId,
      hasImage: !!imageUrl,
      hasContent: !!content,
    });

    if (conversation.platform === 'facebook') {
      console.log('✅ Facebook platform detected, sending via Facebook Messenger API');

      // Get Facebook integration
      const integration = await prisma.integration.findFirst({
        where: {
          provider: 'facebook',
          isActive: true,
          companyId: conversation.companyId,
        },
      });

      if (!integration || !integration.accessToken) {
        console.error('❌ Facebook integration not found or not configured');
        throw new AppError('Facebook integration not found or not configured', 400);
      }

      console.log('✅ Facebook integration found:', {
        integrationId: integration.id,
        hasAccessToken: !!integration.accessToken,
      });

      // Get recipient PSID from externalUserId
      const recipientId = conversation.externalUserId;
      if (!recipientId) {
        console.error('❌ Recipient ID not found for conversation:', conversation.id);
        throw new AppError('Recipient ID not found for this conversation', 400);
      }

      console.log('📤 Preparing to send to Facebook PSID:', recipientId);

      // Send message via Facebook Messenger API
      try {
        const axios = (await import('axios')).default;
        const apiVersion = 'v18.0';
        const apiUrl = `https://graph.facebook.com/${apiVersion}/me/messages`;

        // Prepare message payload
        const messagePayload: any = {
          recipient: {
            id: recipientId,
          },
        };

        if (imageUrl) {
          // Construct full image URL (must be publicly accessible for Facebook)
          // Priority: NGROK_URL > PUBLIC_URL > API_URL > SERVER_URL > localhost
          const baseUrl = process.env.NGROK_URL
            || process.env.PUBLIC_URL
            || process.env.API_URL
            || process.env.SERVER_URL
            || 'http://localhost:5001';

          const fullImageUrl = imageUrl.startsWith('http')
            ? imageUrl
            : `${baseUrl}${imageUrl}`;

          console.log(`📤 Sending image to Facebook: ${fullImageUrl}`);

          // Send image with optional text
          messagePayload.message = {
            attachment: {
              type: 'image',
              payload: {
                url: fullImageUrl,
                is_reusable: false,
              },
            },
          };

          // If there's text content, add it as a separate text message first
          if (content && content.trim()) {
            // Send text message first
            await axios.post(apiUrl, {
              recipient: { id: recipientId },
              message: { text: content.trim() },
            }, {
              params: {
                access_token: integration.accessToken,
              },
            });
            console.log(`✅ Text message sent to Facebook PSID ${recipientId}`);
          }

          // Send image message
          console.log('📤 Sending image to Facebook API:', {
            recipientId,
            imageUrl: fullImageUrl,
            hasText: !!(content && content.trim()),
          });

          const imageResponse = await axios.post(apiUrl, messagePayload, {
            params: {
              access_token: integration.accessToken,
            },
          });
          console.log(`✅ Image message sent to Facebook PSID ${recipientId}`, {
            messageId: imageResponse.data?.message_id,
          });
        } else if (content && content.trim()) {
          // Send text message only
          messagePayload.message = {
            text: content.trim(),
          };

          console.log('📤 Sending text to Facebook API:', { recipientId, content: content.trim() });

          const textResponse = await axios.post(apiUrl, messagePayload, {
            params: {
              access_token: integration.accessToken,
            },
          });
          console.log(`✅ Text message sent to Facebook PSID ${recipientId}`, {
            messageId: textResponse.data?.message_id,
          });
        } else {
          throw new AppError('Message content or image is required', 400);
        }
      } catch (error: any) {
        console.error('❌ Error sending Facebook message:', {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText,
          recipientId,
          hasImage: !!imageUrl,
          imageUrl: imageUrl,
          hasContent: !!content,
          content: content,
          fullError: JSON.stringify(error.response?.data || error, null, 2),
        });

        // Don't throw error - save message to DB anyway so user can see it in inbox
        // But log the error clearly
        console.error('⚠️ Facebook API call failed, but message will be saved to database');

        // Still throw error so frontend knows it failed
        throw new AppError(
          `Failed to send message to Facebook: ${error.response?.data?.error?.message || error.message}`,
          error.response?.status || 500
        );
      }
    } else if (conversation.platform !== 'whatsapp' && conversation.platform !== 'chatwoot') {
      console.log('⚠️ Unknown conversation platform:', conversation.platform);
      console.log('💡 Conversation details:', {
        id: conversation.id,
        platform: conversation.platform,
        externalUserId: conversation.externalUserId,
      });
    }

    // Save agent message locally
    const message = await prisma.socialMessage.create({
      data: {
        conversationId,
        senderType: 'agent',
        content: content || '', // Allow empty content if only image
        imageUrl: imageUrl || null,
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

  /**
   * Mark all unread messages in a conversation as read
   */
  async markMessagesAsRead(conversationId: number, userId: string, companyId: number) {
    // Verify conversation exists and belongs to company
    const conversation = await prisma.socialConversation.findFirst({
      where: {
        id: conversationId,
        companyId,
      },
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // Mark all unread agent messages as read (customer messages are not marked as read by agent)
    const now = new Date();
    const result = await prisma.socialMessage.updateMany({
      where: {
        conversationId,
        senderType: 'customer', // Only customer messages can be read by agent
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: now,
      },
    });

    return {
      success: true,
      markedCount: result.count,
    };
  },

  /**
   * Mark a single message as read
   */
  async markMessageAsRead(messageId: number, userId: string, companyId: number) {
    // Verify message exists and belongs to company
    const message = await prisma.socialMessage.findFirst({
      where: {
        id: messageId,
        conversation: {
          companyId,
        },
      },
      include: {
        conversation: true,
      },
    });

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    // Only customer messages can be marked as read by agent
    if (message.senderType !== 'customer') {
      throw new AppError('Only customer messages can be marked as read', 400);
    }

    const now = new Date();
    const updated = await prisma.socialMessage.update({
      where: { id: messageId },
      data: {
        isRead: true,
        readAt: now,
      },
    });

    return updated;
  },

  /**
   * Update seen status for messages (from Facebook read receipts)
   */
  async updateSeenStatus(conversationId: number, messageIds: number[], companyId: number) {
    // Verify conversation exists and belongs to company
    const conversation = await prisma.socialConversation.findFirst({
      where: {
        id: conversationId,
        companyId,
      },
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // Mark messages as seen (only agent messages can be seen by customer)
    const now = new Date();
    const result = await prisma.socialMessage.updateMany({
      where: {
        id: {
          in: messageIds,
        },
        conversationId,
        senderType: 'agent', // Only agent messages can be seen by customer
        isSeen: false,
      },
      data: {
        isSeen: true,
        seenAt: now,
      },
    });

    return {
      success: true,
      markedCount: result.count,
    };
  },

  /**
   * Update typing indicator status
   */
  updateTypingStatus(conversationId: number, userId: string, isTyping: boolean) {
    if (isTyping) {
      typingIndicators.set(conversationId, {
        userId,
        isTyping: true,
        updatedAt: new Date(),
      });
    } else {
      typingIndicators.delete(conversationId);
    }

    return {
      success: true,
      isTyping,
    };
  },

  /**
   * Get typing indicator status for a conversation
   */
  getTypingStatus(conversationId: number): { isTyping: boolean; userId?: string } | null {
    const data = typingIndicators.get(conversationId);
    if (!data) {
      return { isTyping: false };
    }

    // Check if indicator is still valid (not older than 5 seconds)
    const now = new Date();
    const diffMs = now.getTime() - data.updatedAt.getTime();
    if (diffMs > 5000) {
      typingIndicators.delete(conversationId);
      return { isTyping: false };
    }

    return {
      isTyping: data.isTyping,
      userId: data.userId,
    };
  },

  /**
   * Assign a conversation to an employee
   */
  async assignConversation(conversationId: number, employeeId: number, companyId: number) {
    // Verify conversation exists and belongs to company
    const conversation = await prisma.socialConversation.findFirst({
      where: {
        id: conversationId,
        companyId,
      },
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // Verify employee exists and belongs to same company
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId,
      },
    });

    if (!employee) {
      throw new AppError('Employee not found or does not belong to your company', 404);
    }

    // Assign conversation
    const updatedConversation = await prisma.socialConversation.update({
      where: { id: conversationId },
      data: {
        assignedTo: employeeId,
        assignedAt: new Date(),
      },
      include: {
        assignedEmployee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return updatedConversation;
  },

  /**
   * Unassign a conversation (remove assignment)
   */
  async unassignConversation(conversationId: number, companyId: number, employeeId: number) {
    // Verify conversation exists and belongs to company
    const conversation = await prisma.socialConversation.findFirst({
      where: {
        id: conversationId,
        companyId,
      },
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // Unassign conversation and create release record
    const [updatedConversation] = await prisma.$transaction([
      prisma.socialConversation.update({
        where: { id: conversationId },
        data: {
          assignedTo: null,
          assignedAt: null,
        },
      }),
      prisma.conversationRelease.create({
        data: {
          conversationId,
          employeeId,
          companyId,
          releasedAt: new Date(),
        },
      }),
    ]);

    return updatedConversation;
  },

  /**
   * Mark conversation as complete (status: 'Closed')
   */
  async completeConversation(conversationId: number, companyId: number) {
    // Verify conversation exists and belongs to company
    const conversation = await prisma.socialConversation.findFirst({
      where: {
        id: conversationId,
        companyId,
      },
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // Update conversation status to Closed
    const updatedConversation = await prisma.socialConversation.update({
      where: { id: conversationId },
      data: {
        status: 'Closed',
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        assignedEmployee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
            releases: true,
          },
        },
      },
    });

    return updatedConversation;
  },

  /**
   * Get conversation statistics (for dashboard)
   */
  async getConversationStats(companyId: number) {
    // Get total assigned conversations count
    const totalAssigned = await prisma.socialConversation.count({
      where: {
        companyId,
        assignedTo: { not: null },
      },
    });

    // Get active employees (employees with assigned conversations) with counts
    const activeEmployeesData = await prisma.socialConversation.groupBy({
      by: ['assignedTo'],
      where: {
        companyId,
        assignedTo: { not: null },
      },
      _count: {
        assignedTo: true,
      },
    });

    // Get employee details
    const employeeIds = activeEmployeesData.map((item) => item.assignedTo!);
    const employees = await prisma.employee.findMany({
      where: {
        id: { in: employeeIds },
        companyId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Map employees with their assigned counts
    const activeEmployees = employees.map((employee) => {
      const assignedData = activeEmployeesData.find((item) => item.assignedTo === employee.id);
      return {
        id: employee.id,
        name: employee.user.name || employee.user.email,
        email: employee.user.email,
        assignedCount: assignedData?._count.assignedTo || 0,
      };
    });

    // Get total releases count
    const totalReleases = await prisma.conversationRelease.count({
      where: {
        companyId,
      },
    });

    // Get releases by employee
    const releasesByEmployeeData = await prisma.conversationRelease.groupBy({
      by: ['employeeId'],
      where: {
        companyId,
      },
      _count: {
        employeeId: true,
      },
      orderBy: {
        _count: {
          employeeId: 'desc',
        },
      },
      take: 10, // Top 10
    });

    const releaseEmployeeIds = releasesByEmployeeData.map((item) => item.employeeId);
    const releaseEmployees = await prisma.employee.findMany({
      where: {
        id: { in: releaseEmployeeIds },
        companyId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const releasesByEmployee = releaseEmployees.map((employee) => {
      const releaseData = releasesByEmployeeData.find((item) => item.employeeId === employee.id);
      return {
        employeeId: employee.id,
        employeeName: employee.user.name || employee.user.email,
        releaseCount: releaseData?._count.employeeId || 0,
      };
    });

    return {
      totalAssigned,
      activeEmployees,
      totalReleases,
      releasesByEmployee,
    };
  },

  /**
   * Get release history for a conversation
   */
  async getConversationReleaseHistory(conversationId: number, companyId: number) {
    // Verify conversation exists and belongs to company
    const conversation = await prisma.socialConversation.findFirst({
      where: {
        id: conversationId,
        companyId,
      },
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // Get all releases for this conversation
    const releases = await prisma.conversationRelease.findMany({
      where: {
        conversationId,
        companyId,
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        releasedAt: 'desc',
      },
    });

    return releases;
  },

  /**
   * Add a label to a conversation
   */
  async addLabel(conversationId: number, labelData: { name: string; source?: string | null }, companyId: number, userId: string) {
    // Validate label name
    if (!labelData.name || labelData.name.trim().length === 0) {
      throw new AppError('Label name is required', 400);
    }
    if (labelData.name.length > 50) {
      throw new AppError('Label name must be 50 characters or less', 400);
    }
    if (labelData.source && labelData.source.length > 100) {
      throw new AppError('Label source must be 100 characters or less', 400);
    }

    // Verify conversation exists and belongs to company
    const conversation = await prisma.socialConversation.findFirst({
      where: {
        id: conversationId,
        companyId,
      },
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // Create label
    const label = await prisma.conversationLabel.create({
      data: {
        conversationId,
        companyId,
        name: labelData.name.trim(),
        source: labelData.source?.trim() || null,
        createdBy: userId,
      },
    });

    return label;
  },

  /**
   * Update a conversation label
   */
  async updateLabel(labelId: number, labelData: { name?: string; source?: string | null }, companyId: number) {
    // Validate if provided
    if (labelData.name !== undefined) {
      if (!labelData.name || labelData.name.trim().length === 0) {
        throw new AppError('Label name is required', 400);
      }
      if (labelData.name.length > 50) {
        throw new AppError('Label name must be 50 characters or less', 400);
      }
    }
    if (labelData.source !== undefined && labelData.source && labelData.source.length > 100) {
      throw new AppError('Label source must be 100 characters or less', 400);
    }

    // Verify label exists and belongs to company
    const label = await prisma.conversationLabel.findFirst({
      where: {
        id: labelId,
        companyId,
      },
    });

    if (!label) {
      throw new AppError('Label not found', 404);
    }

    // Update label
    const updatedLabel = await prisma.conversationLabel.update({
      where: { id: labelId },
      data: {
        ...(labelData.name !== undefined && { name: labelData.name.trim() }),
        ...(labelData.source !== undefined && { source: labelData.source?.trim() || null }),
      },
    });

    return updatedLabel;
  },

  /**
   * Delete a conversation label
   */
  async deleteLabel(labelId: number, companyId: number) {
    // Verify label exists and belongs to company
    const label = await prisma.conversationLabel.findFirst({
      where: {
        id: labelId,
        companyId,
      },
    });

    if (!label) {
      throw new AppError('Label not found', 404);
    }

    // Delete label
    await prisma.conversationLabel.delete({
      where: { id: labelId },
    });

    return { success: true };
  },

  /**
   * Get all labels for a conversation
   */
  async getConversationLabels(conversationId: number, companyId: number) {
    // Verify conversation exists and belongs to company
    const conversation = await prisma.socialConversation.findFirst({
      where: {
        id: conversationId,
        companyId,
      },
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // Get all labels for this conversation
    const labels = await prisma.conversationLabel.findMany({
      where: {
        conversationId,
        companyId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return labels;
  },
};

