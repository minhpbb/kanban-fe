'use client';

import React, { useState, useEffect } from 'react';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { userService } from '@/services/userService';
import { User } from '@/types/user';

interface UserAvatarProps {
  user?: {
    fullName?: string;
    username?: string;
    avatar?: string;
  } | null;
  userId?: number;
  size?: 'small' | 'default' | 'large' | number;
  className?: string;
  style?: React.CSSProperties;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  userId,
  size = 'default',
  className = '',
  style
}) => {
  const [fetchedUser, setFetchedUser] = useState<User | null>(null);

  // Fetch user data if userId is provided
  useEffect(() => {
    if (userId && !user) {
      userService.getUserById(userId)
        .then(userData => {
          setFetchedUser(userData);
        })
        .catch(() => {
          setFetchedUser(null);
        });
    }
  }, [userId, user]);

  // Use provided user or fetched user
  const displayUser = user || fetchedUser;

  // Get the first letter of the user's name
  const getInitials = (): string => {
    if (!displayUser) return 'U';
    
    // Try fullName first, then username, then fallback to 'U'
    const name = displayUser.fullName || displayUser.username || '';
    
    if (!name.trim()) return 'U';
    
    // Get first letter and convert to uppercase
    return name.trim().charAt(0).toUpperCase();
  };

  // Get avatar source
  const avatarSrc = displayUser?.avatar;

  return (
    <Avatar
      size={size}
      src={avatarSrc}
      icon={<UserOutlined />}
      className={`bg-gray-500 ${className}`}
      style={style}
    >
      {!avatarSrc && getInitials()}
    </Avatar>
  );
};

export default UserAvatar;
