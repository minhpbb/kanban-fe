import api from '@/lib/api';
import { User } from '@/types/user';

export interface SearchUsersParams {
  q: string;
}

export const userService = {
  // Search users by name, username, or email
  searchUsers: async (query: string): Promise<User[]> => {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const response = await api.get<User[]>(`/users/search?q=${encodeURIComponent(query.trim())}`);
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId: number): Promise<User> => {
    const response = await api.get<User>(`/users/${userId}`);
    return response.data;
  },

  // Get all users (for admin purposes)
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },
};
