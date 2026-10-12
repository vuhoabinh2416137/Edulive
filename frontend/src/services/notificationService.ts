import { api } from './api';
import { NotificationItem } from '../types/notification';

export const notificationService = {
  getRecentNotifications: async (): Promise<NotificationItem[]> => {
    const response = await api.get<NotificationItem[]>('/notifications');
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await api.get<{ unreadCount: number }>('/notifications/unread-count');
      return response.data.unreadCount;
    } catch {
      return 0;
    }
  },

  markAsRead: async (id: number): Promise<NotificationItem> => {
    const response = await api.patch<NotificationItem>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  }
};
