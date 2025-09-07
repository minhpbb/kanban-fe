import api from '@/lib/api';
import { Project, ProjectRole, ProjectMember } from '@/types/project';

// Project service interfaces
export interface CreateProjectData {
  name: string;
  description?: string;
  avatar?: string;
  startDate?: string;
  endDate?: string;
  settings?: {
    allowGuestAccess?: boolean;
    defaultTaskStatuses?: string[];
    taskLabels?: string[];
  };
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  avatar?: string;
  status?: 'active' | 'archived' | 'deleted';
  startDate?: string;
  endDate?: string;
  settings?: {
    allowGuestAccess?: boolean;
    defaultTaskStatuses?: string[];
    taskLabels?: string[];
  };
}

export interface ProjectListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface AddMemberData {
  userId: number;
  role: ProjectRole;
}

export interface ProjectOverview {
  project: Project;
  statistics: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    totalMembers: number;
    completionPercentage: number;
  };
  recentActivities: Array<{
    id: number;
    type: string;
    description: string;
    userId: number;
    userName: string;
    createdAt: string;
  }>;
  taskDistribution: {
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  };
}

export interface ProjectStatistics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalMembers: number;
  completionPercentage: number;
  averageTaskCompletionTime: number;
  tasksCreatedThisWeek: number;
  tasksCompletedThisWeek: number;
  topContributors: Array<{
    userId: number;
    userName: string;
    tasksCompleted: number;
    avatar?: string;
  }>;
}

export interface ProjectActivity {
  id: number;
  type: string;
  description: string;
  userId: number;
  userName: string;
  userAvatar?: string;
  taskId?: number;
  taskTitle?: string;
  createdAt: string;
}


// Project service
export const projectService = {
  // Get all projects
  getProjects: async (params: ProjectListParams = {}): Promise<{
    projects: Project[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const response = await api.get('/projects', params as Record<string, unknown>);
    const data = response.data as {
      projects: Project[];
      total: number;
      page: number;
      limit: number;
    };
    return {
      ...data,
      totalPages: Math.ceil(data.total / data.limit),
    };
  },

  // Get project by ID
  getProjectById: async (projectId: number): Promise<Project> => {
    const response = await api.get<Project>(`/projects/${projectId}`);
    return response.data;
  },

  // Create project
  createProject: async (projectData: CreateProjectData): Promise<Project> => {
    const response = await api.post<Project>('/projects', projectData);
    return response.data;
  },

  // Update project
  updateProject: async (
    projectId: number,
    projectData: UpdateProjectData
  ): Promise<Project> => {
    const response = await api.patch<Project>(`/projects/${projectId}`, projectData);
    return response.data;
  },

  // Delete project
  deleteProject: async (projectId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/projects/${projectId}`);
    return response.data;
  },

  // Add project member
  addProjectMember: async (
    projectId: number,
    data: AddMemberData
  ): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/projects/${projectId}/members`, data);
    return response.data;
  },

  // Remove project member
  removeProjectMember: async (
    projectId: number,
    userId: number
  ): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/projects/${projectId}/members/${userId}`);
    return response.data;
  },

  // Get project members
  getProjectMembers: async (projectId: number): Promise<{
    members: ProjectMember[];
    total: number;
  }> => {
    const response = await api.get(`/projects/${projectId}/members`);
    return response.data as {
      members: ProjectMember[];
      total: number;
    };
  },

  // Get project overview
  getProjectOverview: async (projectId: number): Promise<ProjectOverview> => {
    const response = await api.get<ProjectOverview>(`/projects/${projectId}/overview`);
    return response.data;
  },

  // Get project statistics
  getProjectStatistics: async (
    projectId: number,
    period?: string
  ): Promise<ProjectStatistics> => {
    const response = await api.get<ProjectStatistics>(`/projects/${projectId}/statistics`, {
      period,
    });
    return response.data;
  },

  // Get project activities
  getProjectActivities: async (
    projectId: number,
    params: {
      limit?: number;
      type?: string;
    } = {}
  ): Promise<{
    activities: ProjectActivity[];
    total: number;
  }> => {
    const response = await api.get(`/projects/${projectId}/activities`, params as Record<string, unknown>);
    return response.data as {
      activities: ProjectActivity[];
      total: number;
    };
  },

};

export default projectService;
