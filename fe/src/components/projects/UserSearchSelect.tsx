'use client';

import React, { useState, useEffect } from 'react';
import { Select, Spin } from 'antd';
import { User } from '@/types/user';
import { userService } from '@/services/userService';
import { UserAvatar } from '@/components/common';

const { Option } = Select;

interface UserSearchSelectProps {
  onSelect: (user: User) => void;
  placeholder?: string;
  disabled?: boolean;
  excludeUserIds?: number[];
  selectedUser?: User | null;
}

const UserSearchSelect: React.FC<UserSearchSelectProps> = ({
  onSelect,
  placeholder = 'Search users by name or email...',
  disabled = false,
  excludeUserIds = [],
  selectedUser = null
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Fetch users when search value changes
  useEffect(() => {
    const searchUsers = async () => {
      if (searchValue.length < 2) {
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
        const users = await userService.searchUsers(searchValue);
        const filteredUsers = users.filter((user: User) => 
          !excludeUserIds.includes(user.id)
        );
        setUsers(filteredUsers);
      } catch (error) {
        console.error('Failed to search users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchValue, excludeUserIds]);

  const handleSelect = (value: string | { value: string; label: React.ReactNode } | undefined) => {
    if (!value) return;
    const userId = typeof value === 'string' ? value : value.value;
    const user = users.find(user => user.id === parseInt(userId));
    if (user) {
      onSelect(user);
      setSearchValue('');
      setUsers([]);
    }
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  return (
    <Select
      showSearch
      placeholder={placeholder}
      disabled={disabled}
      loading={loading}
      value={selectedUser ? {
        value: selectedUser.id.toString(),
        label: (
          <div className="flex items-center space-x-2">
            <UserAvatar user={selectedUser} size="small" />
            <span className="font-medium">{selectedUser.fullName}</span>
          </div>
        )
      } : undefined}
      onSearch={handleSearch}
      onSelect={handleSelect}
      notFoundContent={loading ? <Spin size="small" /> : 'No users found'}
      filterOption={false}
      style={{ width: '100%' }}
      size="large"
      labelInValue={true}
    >
      {users.map((user) => (
        <Option 
          key={user.id} 
          value={user.id.toString()}
          label={
            <div className="flex items-center space-x-2">
              <UserAvatar user={user} size="small" />
              <span className="font-medium">{user.fullName}</span>
            </div>
          }
        >
          <div className="flex items-center space-x-3">
            <UserAvatar user={user} size="small" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {user.fullName}
              </div>
              <div className="text-sm text-gray-500 truncate">
                @{user.username} • {user.email}
              </div>
            </div>
          </div>
        </Option>
      ))}
    </Select>
  );
};

export default UserSearchSelect;
