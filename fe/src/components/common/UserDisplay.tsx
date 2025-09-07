'use client';

import React, { useState, useEffect } from 'react';
import { userService } from '@/services/userService';
import { User } from '@/types/user';

interface UserDisplayProps {
  userId?: number;
  user?: User | null;
  fallback?: string;
  className?: string;
}

const UserDisplay: React.FC<UserDisplayProps> = ({
  userId,
  user,
  fallback = 'Unassigned',
  className = ''
}) => {
  const [fetchedUser, setFetchedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch user data if userId is provided
  useEffect(() => {
    if (userId && !user) {
      setLoading(true);
      userService.getUserById(userId)
        .then(userData => {
          setFetchedUser(userData);
        })
        .catch(() => {
          setFetchedUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [userId, user]);

  // Use provided user or fetched user
  const displayUser = user || fetchedUser;

  if (loading) {
    return <span className={className}>Loading...</span>;
  }

  if (!displayUser) {
    return <span className={className}>{fallback}</span>;
  }

  return (
    <span className={className}>
      {displayUser.fullName || displayUser.username || fallback}
    </span>
  );
};

export default UserDisplay;
