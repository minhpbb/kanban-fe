'use client';

import React, { useEffect, useState } from 'react';
import { MoreOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { Button, Dropdown, message } from 'antd';
import NotificationBell from './NotificationBell';
import { useAppSelector, useAppDispatch } from '@/store';
import { UserAvatar } from '@/components/common';
import { logoutUser } from '@/store/slices/authSlice';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showTabs?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  showNewButton?: boolean;
  onNewClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showTabs = false,
  activeTab = 'kanban',
  onTabChange,
  showNewButton = false,
  onNewClick
}) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Debug user data
  console.log('Header - User data:', user);
  
  const tabs = [
    { key: 'kanban', label: 'Kanban' },
  ];

  const handleUserMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'profile':
        message.info('Profile đang được phát triển');
        break;
      case 'logout':
        dispatch(logoutUser());
        message.success('Đăng xuất thành công');
        break;
      default:
        break;
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: (
        <div className="flex items-center space-x-2 py-1">
          <UserOutlined className="text-gray-500" />
          <span>Profile</span>
        </div>
      ),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: (
        <div className="flex items-center space-x-2 py-1 text-red-600">
          <LogoutOutlined />
          <span>Logout</span>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Main Header */}
      <div className="px-4 lg:px-8 py-4 lg:py-6">
        <div className="flex items-center justify-between">
          {/* Left Side - Title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1 truncate">{title}</h1>
            {subtitle && (
              <p className="text-gray-600 text-sm lg:text-base truncate">{subtitle}</p>
            )}
          </div>

          {/* Right Side - User Menu */}
          <div className="flex items-center space-x-2 lg:space-x-4 ml-4">
            {showNewButton && (
              <Button 
                type="primary" 
                className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600 text-sm lg:text-base"
                onClick={onNewClick}
                size="small"
              >
                <span className="hidden sm:inline">+ New</span>
                <span className="sm:hidden">+</span>
              </Button>
            )}
            
            {/* Notification Bell */}
            <NotificationBell userId={user?.id} />
            
            <Dropdown 
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }} 
              trigger={['click']} 
              placement="bottomRight"
              overlayStyle={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}
            >
              <div className="flex items-center space-x-2 lg:space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors duration-200">
                <UserAvatar user={user} size="small" />
                <div className="flex px-2 flex-col items-start">
                  <span className="text-sm font-medium text-gray-900 truncate max-w-24">
                    {isClient ? (user?.fullName || user?.username || 'User') : 'User'}
                  </span>
                  <span className="text-xs text-gray-500 truncate max-w-24">
                    {isClient ? (user?.email || 'user@example.com') : 'user@example.com'}
                  </span>
                </div>
                <MoreOutlined className="text-gray-400 text-sm" />
              </div>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {showTabs && (
        <div className="px-4 lg:px-8 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => onTabChange?.(tab.key)}
                  className={`px-3 lg:px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm lg:text-base ${
                    activeTab === tab.key
                      ? 'bg-gray-100 text-gray-800'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
