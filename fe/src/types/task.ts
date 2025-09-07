import { User } from './user';
import { Project } from './project';

// Task interface - matching backend entity
export interface Task {
  id: number;
  title: string;
  description?: string;
  projectId: number;
  boardId: number;
  columnId: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeIds?: number[]; // Array of assignee user IDs
  createdById: number;
  order: number;
  dueDate?: string;
  labels?: string[];
  attachments?: {
    filename: string;
    url: string;
    size: number;
    type: string;
  }[];
  comments?: {
    id: number;
    userId: number;
    content: string;
    createdAt: string;
  }[];
  customFields?: {
    [key: string]: unknown;
  };
  timeTracking?: {
    estimatedHours?: number;
    actualHours?: number;
    startedAt?: string;
    completedAt?: string;
  };
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Frontend computed fields
  assignee?: User;
  project?: Project;
  // status is computed from columnId, not stored directly
}

// Comment interface
export interface Comment {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt?: string;
  user?: {
    id: number;
    fullName: string;
    username: string;
    avatar?: string;
  };
}
