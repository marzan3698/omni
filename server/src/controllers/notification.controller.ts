import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service.js';

export const notificationController = {
  /**
   * Get notifications for current user
   */
  async getMyNotifications(req: Request, res: Response) {
    const { userId, companyId } = (req as any).user;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const notifications = await notificationService.getUserNotifications(userId, companyId, limit);
    const unreadCount = await notificationService.getUnreadCount(userId, companyId);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(req: Request, res: Response) {
    const { companyId } = (req as any).user;
    const notificationId = parseInt(req.params.id);

    await notificationService.markAsRead(notificationId, companyId);

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(req: Request, res: Response) {
    const { userId, companyId } = (req as any).user;

    await notificationService.markAllAsRead(userId, companyId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  },
};
