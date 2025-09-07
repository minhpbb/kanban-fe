import api from '@/lib/api';
import { User } from '@/types/user';

// Auth service interfaces
export interface LoginCredentials {
  username: string; // Backend accepts username or email
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName: string;
  avatar?: string;
}

export interface AuthResponse {
  user: User;
  message: string;
}

export interface RefreshTokenResponse {
  message: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileData {
  fullName?: string;
  avatar?: string;
  isEmailVerified?: boolean;
}

// Auth service
export const authService = {
  // Login user (cookies are set automatically by backend)
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  // Register user
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  // Refresh token (uses cookie automatically)
  refreshToken: async (): Promise<RefreshTokenResponse> => {
    const response = await api.post<RefreshTokenResponse>('/auth/refresh');
    return response.data;
  },

  // Logout user (cookies are cleared automatically by backend)
  logout: async (): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/logout');
    return response.data;
  },

  // Logout from all devices
  logoutAll: async (): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/logout-all');
    return response.data;
  },

  // Get current user profile
  getProfile: async (): Promise<{ message: string; userId: number }> => {
    const response = await api.get<{ message: string; userId: number }>('/auth/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: UpdateProfileData): Promise<AuthResponse> => {
    const response = await api.put<AuthResponse>('/auth/profile', data);
    return response.data;
  },

  // Change password
  changePassword: async (data: ChangePasswordData): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/change-password', data);
    return response.data;
  },

  // Get user permissions
  getPermissions: async (): Promise<{ permissions: string[] }> => {
    const response = await api.get<{ permissions: string[] }>('/auth/permissions');
    return response.data;
  },
};

export default authService;
