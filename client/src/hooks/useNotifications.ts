import { useState, useEffect, useCallback } from 'react';
import { notificationApi } from '@/lib/api';
import { useSocket } from './useSocket';
import { useAuth } from '@/contexts/AuthContext';
import Swal from 'sweetalert2';
import { playLongNotificationSound } from '@/utils/notificationSound';
import type { Notification } from '@/types';

export function useNotifications() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await notificationApi.getMy(20);
      if (response.data.success) {
        setNotifications(response.data.data.notifications);
        setUnreadCount(response.data.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!socket || !user) return;

    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show SweetAlert for real-time notifications
      const isAdmin = user?.roleName === 'SuperAdmin' || user?.roleName === 'Admin';
      
      if (isAdmin) {
        console.log('Playing notification sound for role:', user?.roleName);
        playLongNotificationSound();
        const isExchange = notification.type === 'exchange';
        
        Swal.fire({
          title: notification.title,
          text: notification.message,
          icon: isExchange ? 'info' : (notification.type === 'payment' ? 'success' : 'info'),
          toast: true,
          position: 'top-end',
          showConfirmButton: true,
          confirmButtonText: isExchange ? 'View Exchange' : 'View Details',
          timer: 10000,
          timerProgressBar: true,
          customClass: {
            popup: 'premium-toast',
          }
        }).then((result) => {
          if (result.isConfirmed && notification.link) {
            window.location.href = notification.link;
          }
        });
      }
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket, user]);

  const markAsRead = async (id: number) => {
    try {
      const response = await notificationApi.markAsRead(id);
      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await notificationApi.markAllAsRead();
      if (response.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
