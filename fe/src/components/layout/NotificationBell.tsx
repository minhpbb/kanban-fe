'use client';

import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Button, Empty, Typography, Spin } from 'antd';
import { BellOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchNotifications, markAsRead, markAllAsRead, deleteNotification, getUnreadCount } from '@/store/slices/notificationSlice';
import { NotificationStatus } from '@/types/notification';
import { formatDate } from '@/utils/dateUtils';
import { useSSE } from '@/hooks';

const { Text } = Typography;

interface NotificationBellProps {
  userId?: number;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
  const dispatch = useAppDispatch();
  const { notifications, unreadCount, isLoading } = useAppSelector((state) => state.notifications);
  const [loading, setLoading] = useState(false);
  
  // Debug: Log notifications state changes
  console.log('🔔 NotificationBell: notifications state:', notifications);
  console.log('🔔 NotificationBell: unreadCount:', unreadCount);
  
  // Initialize SSE connection for real-time notifications
  useSSE(userId);

  useEffect(() => {
    console.log('🔔 NotificationBell: Component mounted, userId:', userId);
    // Fetch notifications and unread count when component mounts
    dispatch(fetchNotifications({}));
    dispatch(getUnreadCount());
  }, [dispatch, userId]);

  const handleMarkAsRead = async (notificationId: number) => {
    setLoading(true);
    try {
      await dispatch(markAsRead(notificationId)).unwrap();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      await dispatch(markAllAsRead()).unwrap();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    console.log('🗑️ Deleting notification:', notificationId);
    setLoading(true);
    try {
      await dispatch(deleteNotification(notificationId)).unwrap();
      console.log('✅ Notification deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
      case 'task_created':
        return '📋';
      case 'task_commented':
        return '💬';
      case 'member_added':
      case 'member_removed':
        return '👥';
      case 'project_created':
      case 'project_updated':
        return '📁';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'task_assigned':
      case 'task_created':
        return '#1890ff';
      case 'task_commented':
        return '#52c41a';
      case 'member_added':
        return '#722ed1';
      case 'member_removed':
        return '#ff4d4f';
      case 'project_created':
      case 'project_updated':
        return '#fa8c16';
      default:
        return '#8c8c8c';
    }
  };

  const notificationItems = [
    {
      key: 'header',
      label: (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <BellOutlined className="text-blue-500" />
            <Text strong className="text-gray-800">Notifications</Text>
            {unreadCount > 0 && (
              <Badge count={unreadCount} size="small" style={{ backgroundColor: '#ef4444' }} />
            )}
            {/* Debug: Always show unread count */}
            <span className="text-xs text-red-500 ml-2">({unreadCount})</span>
          </div>
          {unreadCount > 0 && (
            <Button 
              type="link" 
              size="small" 
              onClick={handleMarkAllAsRead}
              className="text-blue-500 hover:text-blue-700"
              loading={loading}
            >
              Mark all as read
            </Button>
          )}
        </div>
      ),
    },
    {
      key: 'notifications',
      label: (
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spin size="small" />
            </div>
          ) : notifications.length === 0 ? (
            <Empty 
              description="No notifications" 
              className="py-8"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <div>
              {/* Debug: Show notification count */}
              <div className="p-2 text-xs text-gray-500 bg-gray-100">
                Total: {notifications.length}, Unread: {unreadCount}
              </div>
              <List
                dataSource={notifications}
                renderItem={(notification) => (
                  <List.Item
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${
                      notification.status === NotificationStatus.UNREAD ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'
                    }`}
                    onClick={() => notification.status === NotificationStatus.UNREAD && handleMarkAsRead(notification.id)}
                  >
                    {/* Debug: Show notification status */}
                    <div className="text-xs text-gray-400 mb-1">
                      ID: {notification.id}, Status: {notification.status}
                    </div>
                    <div className="flex items-start space-x-3 w-full">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-base shadow-sm"
                        style={{ backgroundColor: getNotificationColor(notification.type) }}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Text 
                              strong={notification.status === NotificationStatus.UNREAD}
                              className={`block text-sm leading-5 ${notification.status === NotificationStatus.UNREAD ? 'text-gray-900' : 'text-gray-700'}`}
                            >
                              {notification.title}
                            </Text>
                            <Text 
                              className={`block text-xs mt-1 leading-4 ${notification.status === NotificationStatus.UNREAD ? 'text-gray-700' : 'text-gray-500'}`}
                            >
                              {notification.message}
                            </Text>
                            <Text className="block text-xs text-gray-400 mt-2 font-medium">
                              {formatDate(notification.createdAt)}
                            </Text>
                          </div>
                          <div className="flex items-center space-x-2 ml-2">
                            {notification.status === NotificationStatus.UNREAD && (
                              <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                            )}
                            <Button
                              type="text"
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification.id);
                              }}
                              className="text-gray-400 hover:text-red-500 transition-colors duration-150"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'footer',
      label: (
        <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
          <Button type="link" size="small" className="text-blue-500 hover:text-blue-700 font-medium">
            View all notifications
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Dropdown
      menu={{ items: notificationItems }}
      trigger={['click']}
      placement="bottomRight"
      className="cursor-pointer"
      overlayStyle={{
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}
    >
      <div className="relative p-3 hover:bg-gray-100 rounded-full transition-all duration-200 group">
        <BellOutlined className="text-xl text-gray-800 group-hover:text-blue-600 transition-colors duration-200" style={{ 
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
          fontWeight: 'bold',
          color: '#374151'
        }} />
        {unreadCount > 0 && (
          <Badge 
            count={unreadCount} 
            size="small"
            className="absolute -top-1 -right-1"
            style={{ 
              backgroundColor: '#ef4444',
              fontSize: '11px',
              fontWeight: 'bold',
              minWidth: '18px',
              height: '18px',
              lineHeight: '18px',
              border: '2px solid white',
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)',
              animation: 'pulse 2s infinite'
            }}
          />
        )}
      </div>
    </Dropdown>
  );
};

export default NotificationBell;