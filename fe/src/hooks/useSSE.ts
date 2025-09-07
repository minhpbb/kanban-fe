import { useEffect, useRef } from 'react';
import { useAppDispatch } from '@/store';
import { addNotification } from '@/store/slices/notificationSlice';
import { addActivity } from '@/store/slices/projectSlice';
import { Notification } from '@/types/notification';
import sseService from '@/services/sseService';

export const useSSE = (userId?: number) => {
  const dispatch = useAppDispatch();
  const isConnectedRef = useRef(false);

  useEffect(() => {
    console.log('🔌 useSSE: useEffect called with userId:', userId);
    if (!userId) {
      console.log('❌ useSSE: No userId provided, skipping SSE connection');
      return;
    }

    console.log('🔌 useSSE: Connecting to SSE for userId:', userId);
    // Connect to SSE
    sseService.connect(userId);

    // Subscribe to notifications
    const unsubscribeNotification = sseService.onNotification((notification: Notification) => {
      console.log('🔔 New notification received via SSE:', notification);
      dispatch(addNotification(notification));
    });

    // Subscribe to activity updates
    const unsubscribeActivity = sseService.onActivityUpdate((data: any) => {
      console.log('New activity received:', data);
      if (data.type === 'activity' && data.activity) {
        dispatch(addActivity({
          projectId: data.projectId,
          activity: data.activity
        }));
      }
    });

    // Subscribe to connection status
    const unsubscribeConnection = sseService.onConnectionStatus((connected: boolean) => {
      isConnectedRef.current = connected;
      console.log('🔗 SSE connection status:', connected);
    });

    // Check connection status periodically
    const statusCheck = setInterval(() => {
      const isConnected = sseService.isConnected();
      console.log('🔍 SSE status check:', isConnected ? 'CONNECTED' : 'DISCONNECTED');
    }, 10000); // Check every 10 seconds

    // Cleanup on unmount
    return () => {
      clearInterval(statusCheck);
      unsubscribeNotification();
      unsubscribeActivity();
      unsubscribeConnection();
      sseService.disconnect();
    };
  }, [userId, dispatch]);

  return {
    isConnected: () => sseService.isConnected(),
    disconnect: () => sseService.disconnect(),
  };
};
