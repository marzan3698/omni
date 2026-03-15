import { prisma } from '../lib/prisma.js';
import { SocketIOServer } from '../socket/socketServer.js';

export const notificationService = {
  /**
   * Create a new notification and emit it via Socket.io
   */
  async createNotification(data: {
    companyId: number;
    userId?: string;
    title: string;
    message: string;
    type?: string;
    link?: string;
  }) {
    const notification = await prisma.notification.create({
      data: {
        companyId: data.companyId,
        userId: data.userId || null,
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        link: data.link || null,
      },
    });

    // Emit to socket if global or specific user
    const io = (global as any).io as SocketIOServer;
    if (io) {
      if (data.userId) {
        // Emit to specific user room (assuming users are joined to rooms named by their userId)
        io.to(`user:${data.userId}`).emit('notification:new', notification);
      } else {
        // Emit to company room (assuming users are joined to rooms named by their companyId)
        io.to(`company:${data.companyId}`).emit('notification:new', notification);
      }
    }

    return notification;
  },

  /**
   * Get notifications for a user/company
   */
  async getUserNotifications(userId: string, companyId: number, limit = 20) {
    return await prisma.notification.findMany({
      where: {
        companyId,
        OR: [
          { userId: userId },
          { userId: null }, // Global notifications for the company
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: number, companyId: number) {
    return await prisma.notification.update({
      where: {
        id: notificationId,
        companyId,
      },
      data: {
        isRead: true,
      },
    });
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string, companyId: number) {
    return await prisma.notification.updateMany({
      where: {
        companyId,
        OR: [
          { userId: userId },
          { userId: null },
        ],
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string, companyId: number) {
    return await prisma.notification.count({
      where: {
        companyId,
        OR: [
          { userId: userId },
          { userId: null },
        ],
        isRead: false,
      },
    });
  },
};
