import { axiosInstance } from '@/lib/axios';
import { Project, Task } from '@/types/api';

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  assignedTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

export interface DashboardData {
  stats: DashboardStats;
  assignedTasks: Task[];
  recentProjects: Project[];
}

export const dashboardService = {
  // Get dashboard data by aggregating from multiple endpoints
  async getDashboardData(): Promise<DashboardData> {
    try {
      // Get user's projects
      const projectsResponse = await axiosInstance.get('/projects?limit=50');
      const projects: Project[] = projectsResponse.data.projects || [];

      // Get tasks from all user's projects
      let allTasks: Task[] = [];
      let assignedTasks: Task[] = [];
      
      // Get current user ID from auth profile
      const profileResponse = await axiosInstance.get('/auth/profile');
      const currentUserId = profileResponse.data.userId;

      // Fetch tasks from each project
      for (const project of projects.slice(0, 10)) { // Limit to first 10 projects for performance
        try {
          const tasksResponse = await axiosInstance.get(`/tasks/project/${project.id}`);
          const projectTasks: Task[] = tasksResponse.data.tasks || [];
          allTasks = [...allTasks, ...projectTasks];
          
          // Filter tasks assigned to current user
          const userTasks = projectTasks.filter(task => 
            task.assigneeIds && task.assigneeIds.includes(currentUserId)
          );
          assignedTasks = [...assignedTasks, ...userTasks];
        } catch (error) {
          console.warn(`Failed to fetch tasks for project ${project.id}:`, error);
        }
      }

      // Calculate statistics
      const now = new Date();
      const completedTasks = allTasks.filter(task => 
        task.columnId && ['done', 'completed', 'finished'].some(status => 
          task.columnId?.toString().toLowerCase().includes(status)
        )
      );
      
      const overdueTasks = allTasks.filter(task => 
        task.dueDate && new Date(task.dueDate) < now && 
        !completedTasks.some(completed => completed.id === task.id)
      );

      const stats: DashboardStats = {
        totalProjects: projects.length,
        totalTasks: allTasks.length,
        assignedTasks: assignedTasks.length,
        completedTasks: completedTasks.length,
        overdueTasks: overdueTasks.length,
      };

      // Sort projects by most recent
      const recentProjects = projects
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        .slice(0, 6);

      // Sort assigned tasks by due date and priority
      const sortedAssignedTasks = assignedTasks
        .sort((a, b) => {
          // First sort by due date (overdue first)
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }
          if (a.dueDate && !b.dueDate) return -1;
          if (!a.dueDate && b.dueDate) return 1;
          
          // Then by priority
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;
          return aPriority - bPriority;
        })
        .slice(0, 10);

      return {
        stats,
        assignedTasks: sortedAssignedTasks,
        recentProjects,
      };
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      throw error;
    }
  },

  // Get user's assigned tasks across all projects
  async getAssignedTasks(limit: number = 10): Promise<Task[]> {
    try {
      const projectsResponse = await axiosInstance.get('/projects?limit=20');
      const projects: Project[] = projectsResponse.data.projects || [];
      
      const profileResponse = await axiosInstance.get('/auth/profile');
      const currentUserId = profileResponse.data.userId;

      let assignedTasks: Task[] = [];
      
      for (const project of projects) {
        try {
          const tasksResponse = await axiosInstance.get(`/tasks/project/${project.id}`);
          const projectTasks: Task[] = tasksResponse.data.tasks || [];
          const userTasks = projectTasks.filter(task => 
            task.assigneeIds && task.assigneeIds.includes(currentUserId)
          );
          assignedTasks = [...assignedTasks, ...userTasks];
        } catch (error) {
          console.warn(`Failed to fetch tasks for project ${project.id}:`, error);
        }
      }

      return assignedTasks
        .sort((a, b) => {
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }
          if (a.dueDate && !b.dueDate) return -1;
          if (!a.dueDate && b.dueDate) return 1;
          return 0;
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch assigned tasks:', error);
      throw error;
    }
  },

  // Get user's recent projects
  async getRecentProjects(limit: number = 6): Promise<Project[]> {
    try {
      const response = await axiosInstance.get(`/projects?limit=${limit * 2}`);
      const projects: Project[] = response.data.projects || [];
      
      return projects
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch recent projects:', error);
      throw error;
    }
  },
};