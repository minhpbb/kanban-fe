import axiosInstance from './axios';

// API Response Types
export interface ApiResponse<T = unknown> {
  errCode: string;
  reason: string;
  result: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T = unknown> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Generic API functions
export const api = {
  // GET request
  get: async <T = unknown>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> => {
    const response = await axiosInstance.get(url, { params });
    return response.data;
  },

  // POST request
  post: async <T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
    const response = await axiosInstance.post(url, data);
    return response.data;
  },

  // PUT request
  put: async <T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
    const response = await axiosInstance.put(url, data);
    return response.data;
  },

  // PATCH request
  patch: async <T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
    const response = await axiosInstance.patch(url, data);
    return response.data;
  },

  // DELETE request
  delete: async <T = unknown>(url: string): Promise<ApiResponse<T>> => {
    const response = await axiosInstance.delete(url);
    return response.data;
  },

  // Upload file
  upload: async <T = unknown>(url: string, formData: FormData): Promise<ApiResponse<T>> => {
    const response = await axiosInstance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default api;
