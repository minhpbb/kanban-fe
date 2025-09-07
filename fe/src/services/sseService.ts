import { Notification } from '@/types/notification';

export interface SSEMessage {
  type: 'notification' | 'heartbeat' | 'connected' | 'error';
  data?: Notification | unknown;
  message?: string;
  userId?: number;
  timestamp?: string;
}

class SSEService {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: SSEMessage) => void>> = new Map();
  private activityListeners: Set<(data: { type: string; activity: unknown; projectId: number }) => void> = new Set();

  connect(userId: number): void {
    // If already connected to the same user, don't reconnect
    if (this.eventSource && this.eventSource.readyState === EventSource.OPEN) {
      console.log('🔄 SSE: Already connected, skipping reconnection');
      return;
    }
    
    if (this.eventSource) {
      console.log('🔄 SSE: Disconnecting existing connection before reconnecting');
      this.disconnect();
    }

    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const url = `${baseURL}/notifications/sse?userId=${userId}`;
    
    console.log('🔌 Connecting to SSE:', url, 'for userId:', userId);
    this.eventSource = new EventSource(url, {
      withCredentials: true,
    });

    this.eventSource.onopen = () => {
      console.log('✅ SSE connection opened successfully');
      this.reconnectAttempts = 0;
    };

    this.eventSource.onmessage = (event) => {
      try {
        console.log('📨 SSE: Raw message received:', event.data);
        const message: SSEMessage = JSON.parse(event.data);
        console.log('📨 SSE: Parsed message:', message);
        this.handleMessage(message);
      } catch (error) {
        console.error('❌ SSE: Failed to parse message:', error);
        console.error('❌ SSE: Raw data:', event.data);
      }
    };

    // Handle activity updates
    this.eventSource.addEventListener('activity', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Activity update received:', data);
        this.activityListeners.forEach(listener => listener(data));
      } catch (error) {
        console.error('Failed to parse activity message:', error);
      }
    });

    this.eventSource.onerror = (error) => {
      console.error('❌ SSE connection error:', error);
      console.error('SSE readyState:', this.eventSource?.readyState);
      console.error('SSE URL:', this.eventSource?.url);
      this.handleReconnect();
    };

    this.eventSource.addEventListener('notification', (event) => {
      try {
        const message: SSEMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse notification message:', error);
      }
    });
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  private handleMessage(message: SSEMessage): void {
    console.log('SSE message received:', message);
    
    // Notify all listeners
    const listeners = this.listeners.get(message.type) || new Set();
    listeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error('Error in SSE listener:', error);
      }
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect SSE (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.eventSource) {
          this.connect(1); // TODO: Get userId from auth context
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max SSE reconnection attempts reached');
    }
  }

  // Subscribe to specific message types
  subscribe(type: string, callback: (data: SSEMessage) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    
    this.listeners.get(type)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(type);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(type);
        }
      }
    };
  }

  // Subscribe to notifications specifically
  onNotification(callback: (notification: Notification) => void): () => void {
    return this.subscribe('notification', (message) => {
      console.log('🔔 SSE: Processing notification message:', message);
      // Backend sends notification data directly in the message, not in message.data
      if (message && typeof message === 'object' && 'id' in message && message.type === 'notification') {
        console.log('✅ SSE: Valid notification data found, calling callback');
        callback(message as unknown as Notification);
      } else {
        console.log('❌ SSE: Invalid notification data structure:', message);
      }
    });
  }

  // Subscribe to connection status
  onConnectionStatus(callback: (connected: boolean) => void): () => void {
    return this.subscribe('connected', () => callback(true));
  }

  // Subscribe to activity updates
  onActivityUpdate(callback: (data: { type: string; activity: unknown; projectId: number }) => void): () => void {
    this.activityListeners.add(callback);
    return () => {
      this.activityListeners.delete(callback);
    };
  }

  // Check if connected
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}

// Export singleton instance
export const sseService = new SSEService();
export default sseService;
