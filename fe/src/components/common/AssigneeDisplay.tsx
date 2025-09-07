'use client';

import React, { useState, useEffect } from 'react';
import { Avatar, Tooltip } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { User } from '@/types/user';
import { userService } from '@/services/userService';
import UserAvatar from './UserAvatar';

interface AssigneeDisplayProps {
  assigneeIds?: number[];
  maxVisible?: number;
  size?: 'small' | 'default' | 'large';
}

const AssigneeDisplay: React.FC<AssigneeDisplayProps> = ({
  assigneeIds = [],
  maxVisible = 2,
  size = 'small'
}) => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (assigneeIds.length > 0) {
      const fetchUsers = async () => {
        try {
          const userPromises = assigneeIds.map(id => userService.getUserById(id));
          const userResults = await Promise.all(userPromises);
          setUsers(userResults.filter(Boolean));
        } catch (error) {
          console.error('Failed to fetch assignee users:', error);
        }
      };

      fetchUsers();
    }
  }, [assigneeIds]);

  if (assigneeIds.length === 0) {
    return (
      <div className="flex items-center space-x-1">
        <Avatar size={size} icon={<UserOutlined />} className="bg-gray-500" />
        <span className="text-gray-500 text-xs">Unassigned</span>
      </div>
    );
  }

  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  return (
    <div className="flex items-center space-x-1">
      {visibleUsers.map((user) => (
        <Tooltip
          key={user.id}
          title={
            <div className="text-center">
              <div className="font-medium">{user.fullName}</div>
              <div className="text-xs text-gray-300">@{user.username}</div>
              <div className="text-xs text-gray-300">{user.email}</div>
            </div>
          }
          placement="top"
        >
          <UserAvatar userId={user.id} size={size} />
        </Tooltip>
      ))}
      
      {remainingCount > 0 && (
        <Tooltip
          title={
            <div>
              <div className="font-medium mb-1">Additional assignees:</div>
              {users.slice(maxVisible).map((user) => (
                <div key={user.id} className="text-xs">
                  {user.fullName} ({user.email})
                </div>
              ))}
            </div>
          }
          placement="top"
        >
          <div className={`${size === 'small' ? 'w-6 h-6' : size === 'large' ? 'w-10 h-10' : 'w-8 h-8'} bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium cursor-help`}>
            +{remainingCount}
          </div>
        </Tooltip>
      )}
      
      <span className="text-xs text-gray-600">
        {assigneeIds.length} assignee{assigneeIds.length > 1 ? 's' : ''}
      </span>
    </div>
  );
};

export default AssigneeDisplay;
