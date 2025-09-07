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

  connect(userId: number): void {
    if (this.eventSource) {
      this.disconnect();
    }

    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const url = `${baseURL}/notifications/sse?userId=${userId}`;
    
    this.eventSource = new EventSource(url, {
      withCredentials: true,
    });

    this.eventSource.onopen = () => {
      console.log('SSE connection opened');
      this.reconnectAttempts = 0;
    };

    this.eventSource.onmessage = (event) => {
      try {
        const message: SSEMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
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
      if (message.data && typeof message.data === 'object' && 'id' in message.data) {
        callback(message.data as Notification);
      }
    });
  }

  // Subscribe to connection status
  onConnectionStatus(callback: (connected: boolean) => void): () => void {
    return this.subscribe('connected', () => callback(true));
  }

  // Check if connected
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}

// Export singleton instance
export const sseService = new SSEService();
export default sseService;
