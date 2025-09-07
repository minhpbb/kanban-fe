import { User } from './user';

export enum ProjectRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export interface ProjectMember {
  id: number;
  projectId: number;
  userId: number;
  role: ProjectRole;
  isActive: boolean;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  // User details
  fullName: string;
  email: string;
  avatar?: string;
}

// Project interface
export interface Project {
  id: number;
  name: string;
  description?: string;
  avatar?: string;
  ownerId: number;
  status: 'active' | 'archived' | 'deleted';
  startDate?: string;
  endDate?: string;
  settings?: {
    allowGuestAccess: boolean;
    defaultTaskStatuses: string[];
    taskLabels: string[];
  };
  activities?: ProjectActivity[];
  createdAt: string;
  updatedAt: string;
}

// Project statistics and overview
export interface ProjectStatistics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalMembers: number;
  activeMembers: number;
}

export interface ProjectOverview {
  project: Project;
  statistics: ProjectStatistics;
  recentActivities: ProjectActivity[];
}

export interface ProjectActivity {
  id: number;
  projectId?: number;
  userId: number;
  type: string;
  description: string;
  userName: string;
  userAvatar?: string;
  username?: string;
  metadata?: Record<string, unknown>;
  entityType?: string;
  entityId?: number;
  isVisible?: boolean;
  createdAt: string;
  user?: User;
}
