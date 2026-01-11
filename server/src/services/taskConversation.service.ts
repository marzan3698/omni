import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { TaskMessageType } from '@prisma/client';

interface CreateConversationData {
  taskId: number;
  companyId: number;
}

interface SendMessageData {
  conversationId: number;
  senderId: string;
  content?: string;
  messageType?: TaskMessageType;
  attachmentId?: number;
}

export const taskConversationService = {
  /**
   * Create conversation for a task
   */
  async createConversation(data: CreateConversationData) {
    // Verify task exists and belongs to company
    const task = await prisma.task.findFirst({
      where: {
        id: data.taskId,
        companyId: data.companyId,
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Check if conversation already exists
    const existingConversation = await prisma.taskConversation.findUnique({
      where: {
        taskId: data.taskId,
      },
    });

    if (existingConversation) {
      return existingConversation;
    }

    // Create conversation
    const conversation = await prisma.taskConversation.create({
      data: {
        taskId: data.taskId,
        companyId: data.companyId,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    // Update task with conversation_id
    await prisma.task.update({
      where: { id: data.taskId },
      data: {
        conversationId: conversation.id,
      },
    });

    return conversation;
  },

  /**
   * Send message in task conversation
   */
  async sendMessage(data: SendMessageData) {
    // Verify conversation exists
    const conversation = await prisma.taskConversation.findUnique({
      where: {
        id: data.conversationId,
      },
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // Verify sender exists
    const sender = await prisma.user.findUnique({
      where: {
        id: data.senderId,
      },
    });

    if (!sender) {
      throw new AppError('Sender not found', 404);
    }

    // Verify attachment exists if provided
    if (data.attachmentId) {
      const attachment = await prisma.taskAttachment.findUnique({
        where: {
          id: data.attachmentId,
        },
      });

      if (!attachment) {
        throw new AppError('Attachment not found', 404);
      }
    }

    // Create message
    const message = await prisma.taskMessage.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content || null,
        messageType: data.messageType || 'text',
        attachmentId: data.attachmentId || null,
        isRead: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            name: true,
            profileImage: true,
          },
        },
        attachment: {
          include: {
            creator: {
              select: {
                id: true,
                email: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    // Update conversation updated_at
    await prisma.taskConversation.update({
      where: { id: data.conversationId },
      data: {
        updatedAt: new Date(),
      },
    });

    return message;
  },

  /**
   * Get messages for a conversation with pagination
   */
  async getMessages(conversationId: number, companyId: number, page: number = 1, limit: number = 50) {
    // Verify conversation exists and belongs to company
    const conversation = await prisma.taskConversation.findFirst({
      where: {
        id: conversationId,
        companyId,
      },
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.taskMessage.findMany({
        where: {
          conversationId,
        },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              name: true,
              profileImage: true,
            },
          },
          attachment: {
            include: {
              creator: {
                select: {
                  id: true,
                  email: true,
                  profileImage: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.taskMessage.count({
        where: {
          conversationId,
        },
      }),
    ]);

    // Reverse messages to show oldest first (like a chat)
    const reversedMessages = messages.reverse();

    // Serialize BigInt values in attachments
    const serializedMessages = reversedMessages.map((message) => {
      if (message.attachment && message.attachment.fileSize) {
        return {
          ...message,
          attachment: {
            ...message.attachment,
            fileSize: Number(message.attachment.fileSize),
          },
        };
      }
      return message;
    });

    return {
      messages: serializedMessages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Mark message as read
   */
  async markAsRead(messageId: number, userId: string, companyId: number) {
    const message = await prisma.taskMessage.findFirst({
      where: {
        id: messageId,
        conversation: {
          companyId,
        },
      },
    });

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    // Only mark as read if not already read and not sent by the same user
    if (!message.isRead && message.senderId !== userId) {
      const updatedMessage = await prisma.taskMessage.update({
        where: { id: messageId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return updatedMessage;
    }

    return message;
  },

  /**
   * Mark all messages in conversation as read for a user
   */
  async markAllAsRead(conversationId: number, userId: string, companyId: number) {
    // Verify conversation exists and belongs to company
    const conversation = await prisma.taskConversation.findFirst({
      where: {
        id: conversationId,
        companyId,
      },
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // Mark all unread messages (not sent by the user) as read
    const result = await prisma.taskMessage.updateMany({
      where: {
        conversationId,
        senderId: {
          not: userId,
        },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      success: true,
      count: result.count,
    };
  },

  /**
   * Get unread message count for a user in a conversation
   */
  async getUnreadCount(conversationId: number, userId: string, companyId: number) {
    // Verify conversation exists and belongs to company
    const conversation = await prisma.taskConversation.findFirst({
      where: {
        id: conversationId,
        companyId,
      },
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    const count = await prisma.taskMessage.count({
      where: {
        conversationId,
        senderId: {
          not: userId,
        },
        isRead: false,
      },
    });

    return count;
  },

  /**
   * Get conversation by task ID
   */
  async getConversationByTaskId(taskId: number, companyId: number) {
    // Verify task exists and belongs to company
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        companyId,
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const conversation = await prisma.taskConversation.findUnique({
      where: {
        taskId,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return conversation;
  },
};

