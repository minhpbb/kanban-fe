import { message, notification } from 'antd';
import { useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  duration?: number;
  description?: string;
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'top' | 'bottom';
}

export const useToast = () => {
  const showToast = useCallback((
    type: ToastType,
    content: string,
    options: ToastOptions = {}
  ) => {
    const { duration = 3, description, placement = 'topRight' } = options;

    // Use notification for more detailed messages
    if (description) {
      notification[type]({
        message: content,
        description,
        duration,
        placement,
        style: {
          marginTop: 24,
        },
      });
    } else {
      // Use message for simple messages
      message[type](content, duration);
    }
  }, []);

  const success = useCallback((content: string, options?: ToastOptions) => {
    showToast('success', content, options);
  }, [showToast]);

  const error = useCallback((content: string, options?: ToastOptions) => {
    showToast('error', content, options);
  }, [showToast]);

  const warning = useCallback((content: string, options?: ToastOptions) => {
    showToast('warning', content, options);
  }, [showToast]);

  const info = useCallback((content: string, options?: ToastOptions) => {
    showToast('info', content, options);
  }, [showToast]);

  return {
    showToast,
    success,
    error,
    warning,
    info,
  };
};
