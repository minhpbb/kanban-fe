'use client';

import React, { useState, useEffect } from 'react';
import { Select, Tag, Spin } from 'antd';
import { User } from '@/types/user';
import { userService } from '@/services/userService';
import UserAvatar from './UserAvatar';

const { Option } = Select;

interface MultipleUserSelectProps {
  value?: number[];
  onChange?: (userIds: number[]) => void;
  placeholder?: string;
  disabled?: boolean;
  excludeUserIds?: number[];
}

const MultipleUserSelect: React.FC<MultipleUserSelectProps> = ({
  value = [],
  onChange,
  placeholder = 'Select users...',
  disabled = false,
  excludeUserIds = []
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Fetch users when component mounts or search changes
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        let response;
        if (searchValue.trim()) {
          // Search users by name/email
          console.log('Searching users with query:', searchValue);
          response = await userService.searchUsers(searchValue);
          console.log('Search results:', response);
        } else {
          // Get all users
          console.log('Fetching all users');
          response = await userService.getAllUsers();
          console.log('All users:', response);
        }
        setUsers(response);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  // Fetch selected users info when value changes
  useEffect(() => {
    const fetchSelectedUsers = async () => {
      if (value.length > 0) {
        try {
          const userPromises = value.map(id => userService.getUserById(id));
          const userResults = await Promise.all(userPromises);
          setSelectedUsers(userResults.filter(Boolean));
        } catch (error) {
          console.error('Failed to fetch selected users:', error);
        }
      } else {
        setSelectedUsers([]);
      }
    };

    fetchSelectedUsers();
  }, [value]);

  // Filter users based on exclusions only (search is handled by API)
  const filteredUsers = users.filter(user => {
    const notExcluded = !excludeUserIds.includes(user.id);
    return notExcluded;
  });

  const handleSearch = (search: string) => {
    setSearchValue(search);
  };

  const handleChange = (userIds: number[]) => {
    onChange?.(userIds);
  };

  const handleDeselect = (userId: number) => {
    const newValue = value.filter(id => id !== userId);
    onChange?.(newValue);
  };


  return (
    <Select
      mode="multiple"
      placeholder={placeholder}
      disabled={disabled}
      loading={loading}
      value={value}
      onChange={handleChange}
      onSearch={handleSearch}
      onDeselect={handleDeselect}
      notFoundContent={
        loading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <Spin size="small" />
            <div className="text-xs text-gray-500 mt-2">
              {searchValue ? 'Searching...' : 'Loading users...'}
            </div>
          </div>
        ) : searchValue ? (
          <div className="text-center py-4 text-gray-500">
            <div className="text-sm">No users found for</div>
            <div className="font-medium">&quot;{searchValue}&quot;</div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <div className="text-sm">No users available</div>
          </div>
        )
      }
      filterOption={false}
      showSearch
      allowClear
      style={{ width: '100%' }}
      size="large"
      className="w-full"
      tagRender={(props) => {
        const { value: userId, closable, onClose } = props;
        const user = selectedUsers.find(u => u.id === userId);
        
        return (
          <Tag
            closable={closable}
            onClose={onClose}
            className="flex items-center space-x-2 mr-1 mb-1 px-2 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <UserAvatar userId={userId} size="small" />
            <span className="text-sm font-medium">
              {user?.fullName || user?.username || `User ${userId}`}
            </span>
          </Tag>
        );
      }}
    >
      {filteredUsers.map((user) => (
        <Option 
          key={user.id} 
          value={user.id} 
          className="py-2 px-3 rounded-md hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3 py-1">
            <UserAvatar userId={user.id} size="small" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {user.fullName || user.username}
              </div>
              <div className="text-xs text-gray-500 truncate">
                @{user.username} • {user.email}
              </div>
            </div>
            {value.includes(user.id) && (
              <div className="text-xs text-blue-500 font-medium bg-blue-50 px-2 py-1 rounded-full">
                Selected
              </div>
            )}
          </div>
        </Option>
      ))}
    </Select>
  );
};

export default MultipleUserSelect;
