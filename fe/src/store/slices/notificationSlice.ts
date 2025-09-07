import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Notification, NotificationStatus } from '@/types/notification';
import { notificationService, NotificationListParams } from '@/services';

// Helper function to extract error message
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error instanceof Error && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message || defaultMessage;
  }
  return defaultMessage;
};

// Notification state interface
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Initial state
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
};

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params: NotificationListParams = {}, { rejectWithValue }) => {
    try {
      return await notificationService.getNotifications(params);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch notifications'));
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: number, { rejectWithValue }) => {
    try {
      await notificationService.markAsRead(notificationId);
      return notificationId;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to mark notification as read'));
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.markAllAsRead();
      return true;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to mark all notifications as read'));
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId: number, { rejectWithValue }) => {
    try {
      await notificationService.deleteNotification(notificationId);
      return notificationId;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to delete notification'));
    }
  }
);

export const getUnreadCount = createAsyncThunk(
  'notifications/getUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationService.getUnreadCount();
      return response.count;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to get unread count'));
    }
  }
);

// Notification slice
const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (action.payload.status === NotificationStatus.UNREAD) {
        state.unreadCount += 1;
      }
      state.pagination.total += 1;
    },
    updateNotification: (state, action: PayloadAction<Notification>) => {
      const index = state.notifications.findIndex(n => n.id === action.payload.id);
      if (index !== -1) {
        const oldStatus = state.notifications[index].status;
        const newStatus = action.payload.status;
        
        state.notifications[index] = action.payload;
        
        // Update unread count
        if (oldStatus === NotificationStatus.UNREAD && newStatus === NotificationStatus.READ) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        } else if (oldStatus === NotificationStatus.READ && newStatus === NotificationStatus.UNREAD) {
          state.unreadCount += 1;
        }
      }
    },
    removeNotification: (state, action: PayloadAction<number>) => {
      const index = state.notifications.findIndex(n => n.id === action.payload);
      if (index !== -1) {
        const notification = state.notifications[index];
        if (notification.status === NotificationStatus.UNREAD) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
        state.pagination.total -= 1;
      }
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload as {
          notifications?: Notification[];
          unreadCount?: number;
          page?: number;
          limit?: number;
          total?: number;
          totalPages?: number;
        } | Notification[];
        
        if (Array.isArray(payload)) {
          state.notifications = payload;
          state.unreadCount = 0;
          state.pagination = {
            page: 1,
            limit: 20,
            total: payload.length,
            totalPages: Math.ceil(payload.length / 20),
          };
        } else {
          state.notifications = payload.notifications || [];
          state.unreadCount = payload.unreadCount || 0;
          state.pagination = {
            page: payload.page || 1,
            limit: payload.limit || 20,
            total: payload.total || payload.notifications?.length || 0,
            totalPages: payload.totalPages || Math.ceil((payload.total || payload.notifications?.length || 0) / (payload.limit || 20)),
          };
        }
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n.id === action.payload);
        if (index !== -1 && state.notifications[index].status === NotificationStatus.UNREAD) {
          state.notifications[index].status = NotificationStatus.READ;
          state.notifications[index].readAt = new Date().toISOString();
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      
      // Mark all as read
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach(notification => {
          if (notification.status === NotificationStatus.UNREAD) {
            notification.status = NotificationStatus.READ;
            notification.readAt = new Date().toISOString();
          }
        });
        state.unreadCount = 0;
      })
      
      // Delete notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n.id === action.payload);
        if (index !== -1) {
          const notification = state.notifications[index];
          if (notification.status === NotificationStatus.UNREAD) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.notifications.splice(index, 1);
          state.pagination.total -= 1;
        }
      })
      
      // Get unread count
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      });
  },
});

export const {
  clearError,
  addNotification,
  updateNotification,
  removeNotification,
  setUnreadCount,
} = notificationSlice.actions;
export default notificationSlice.reducer;
