// API Response interfaces
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Re-export all types for backward compatibility
export * from './user';
export * from './auth';
export * from './project';
export * from './kanban-board';
export * from './task';
export * from './notification';