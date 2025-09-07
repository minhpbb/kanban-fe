import { useEffect, useRef } from 'react';
import { useAppDispatch } from '@/store';
import { addNotification } from '@/store/slices/notificationSlice';
import { Notification } from '@/types/notification';
import sseService from '@/services/sseService';

export const useSSE = (userId?: number) => {
  const dispatch = useAppDispatch();
  const isConnectedRef = useRef(false);

  useEffect(() => {
    if (!userId) return;

    // Connect to SSE
    sseService.connect(userId);

    // Subscribe to notifications
    const unsubscribeNotification = sseService.onNotification((notification: Notification) => {
      console.log('New notification received:', notification);
      dispatch(addNotification(notification));
    });

    // Subscribe to connection status
    const unsubscribeConnection = sseService.onConnectionStatus((connected: boolean) => {
      isConnectedRef.current = connected;
      console.log('SSE connection status:', connected);
    });

    // Cleanup on unmount
    return () => {
      unsubscribeNotification();
      unsubscribeConnection();
      sseService.disconnect();
    };
  }, [userId, dispatch]);

  return {
    isConnected: () => sseService.isConnected(),
    disconnect: () => sseService.disconnect(),
  };
};
