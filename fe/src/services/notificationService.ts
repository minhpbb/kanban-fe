import api from '@/lib/api';
import { Notification, NotificationStatus } from '@/types/notification';

// Notification service interfaces
export interface NotificationListParams {
  page?: number;
  limit?: number;
  status?: NotificationStatus;
  type?: string;
}

export interface MarkAsReadResponse {
  success: boolean;
  unreadCount: number;
}

export interface UnreadCountResponse {
  count: number;
}

// Notification service
export const notificationService = {
  // Get notifications
  getNotifications: async (params: NotificationListParams = {}): Promise<{
    notifications: Notification[];
    unreadCount: number;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const response = await api.get('/notifications', params as Record<string, unknown>);
    return response.data as {
      notifications: Notification[];
      unreadCount: number;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  },

  // Mark notification as read
  markAsRead: async (notificationId: number): Promise<MarkAsReadResponse> => {
    const response = await api.patch<MarkAsReadResponse>(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<{ success: boolean }> => {
    const response = await api.patch<{ success: boolean }>('/notifications/read-all');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId: number): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`);
  },

  // Get unread count
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await api.get<UnreadCountResponse>('/notifications/unread-count');
    return response.data;
  },

  // Get notification by ID
  getNotificationById: async (notificationId: number): Promise<Notification> => {
    const response = await api.get<Notification>(`/notifications/${notificationId}`);
    return response.data;
  },

  // Create notification (for testing/admin purposes)
  createNotification: async (data: {
    userId: number;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }): Promise<Notification> => {
    const response = await api.post<Notification>('/notifications', data);
    return response.data;
  },

  // Update notification
  updateNotification: async (
    notificationId: number,
    data: {
      status?: NotificationStatus;
      title?: string;
      message?: string;
    }
  ): Promise<Notification> => {
    const response = await api.patch<Notification>(`/notifications/${notificationId}`, data);
    return response.data;
  },

  // Get notification settings
  getNotificationSettings: async (): Promise<{
    emailNotifications: boolean;
    pushNotifications: boolean;
    taskNotifications: boolean;
    projectNotifications: boolean;
    commentNotifications: boolean;
  }> => {
    const response = await api.get('/notifications/settings');
    return response.data as {
      emailNotifications: boolean;
      pushNotifications: boolean;
      taskNotifications: boolean;
      projectNotifications: boolean;
      commentNotifications: boolean;
    };
  },

  // Update notification settings
  updateNotificationSettings: async (settings: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    taskNotifications?: boolean;
    projectNotifications?: boolean;
    commentNotifications?: boolean;
  }): Promise<void> => {
    await api.patch('/notifications/settings', settings);
  },
};

export default notificationService;
