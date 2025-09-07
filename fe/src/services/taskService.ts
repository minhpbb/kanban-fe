import api from '@/lib/api';
import { Task, Comment } from '@/types/task';
import { KanbanColumn } from '@/types/kanban-board';

// Task service interfaces
export interface CreateTaskData {
  title: string;
  description?: string;
  projectId: number;
  boardId: number;
  columnId: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: number;
  dueDate?: string;
  labels?: string[];
  timeTracking?: {
    estimatedHours?: number;
    actualHours?: number;
  };
  customFields?: Record<string, unknown>;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: number;
  dueDate?: string;
  labels?: string[];
  timeTracking?: {
    estimatedHours?: number;
    actualHours?: number;
  };
  customFields?: Record<string, unknown>;
}

export interface TaskListParams {
  projectId?: number;
  assigneeId?: number;
  priority?: string;
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface MoveTaskData {
  targetColumnId: number;
  newOrder?: number;
}

export interface AddCommentData {
  content: string;
}

export interface UpdateCommentData {
  content: string;
}

export interface TaskAttachment {
  filename: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export interface CreateColumnData {
  name: string;
  description?: string;
  boardId: number;
  type: 'default' | 'custom';
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
  order: number;
  maxTasks?: number;
  isActive?: boolean;
  isWipLimit?: boolean;
  wipSettings?: {
    limit: number;
    warningThreshold?: number;
  };
}

export interface UpdateColumnData {
  name?: string;
  description?: string;
  type?: 'default' | 'custom';
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
  order?: number;
  maxTasks?: number;
  isActive?: boolean;
  isWipLimit?: boolean;
  wipSettings?: {
    limit: number;
    warningThreshold?: number;
  };
}

// Task service
export const taskService = {
  // Get tasks by project
  getTasksByProject: async (
    projectId: number,
    params: Omit<TaskListParams, 'projectId'> = {}
  ): Promise<{
    tasks: Task[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const response = await api.get(`/tasks/project/${projectId}`, params as Record<string, unknown>);
    const data = response.data as { tasks?: Task[]; total?: number; page?: number; limit?: number; totalPages?: number } | Task[];
    
    // Handle both formats: { tasks: [...] } or direct array
    if (data && typeof data === 'object' && 'tasks' in data && data.tasks) {
      return {
        tasks: data.tasks,
        total: data.total || data.tasks.length,
        page: data.page || 1,
        limit: data.limit || 10,
        totalPages: data.totalPages || Math.ceil((data.total || data.tasks.length) / (data.limit || 10))
      };
    } else if (Array.isArray(data)) {
      return {
        tasks: data,
        total: data.length,
        page: 1,
        limit: 10,
        totalPages: Math.ceil(data.length / 10)
      };
    } else {
      return {
        tasks: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      };
    }
  },

  // Get task by ID
  getTaskById: async (taskId: number): Promise<Task> => {
    const response = await api.get<Task>(`/tasks/${taskId}`);
    return response.data;
  },

  // Create task
  createTask: async (taskData: CreateTaskData): Promise<Task> => {
    const response = await api.post<Task>('/tasks', taskData);
    return response.data;
  },

  // Update task
  updateTask: async (taskId: number, taskData: UpdateTaskData): Promise<Task> => {
    const response = await api.patch<Task>(`/tasks/${taskId}`, taskData);
    return response.data;
  },

  // Delete task
  deleteTask: async (taskId: number): Promise<void> => {
    await api.delete(`/tasks/${taskId}`);
  },

  // Move task
  moveTask: async (taskId: number, moveData: MoveTaskData): Promise<Task> => {
    const response = await api.patch<Task>(`/tasks/${taskId}/move`, moveData);
    return response.data;
  },

  // Add comment to task
  addTaskComment: async (taskId: number, commentData: AddCommentData): Promise<{
    taskId: number;
    comments: Comment[];
  }> => {
    const response = await api.post(`/tasks/${taskId}/comments`, commentData);
    return response.data as {
      taskId: number;
      comments: Comment[];
    };
  },

  // Update comment
  updateTaskComment: async (
    taskId: number,
    commentId: number,
    commentData: UpdateCommentData
  ): Promise<Comment> => {
    const response = await api.patch<Comment>(
      `/tasks/${taskId}/comments/${commentId}`,
      commentData
    );
    return response.data;
  },

  // Delete comment
  deleteTaskComment: async (taskId: number, commentId: number): Promise<void> => {
    await api.delete(`/tasks/${taskId}/comments/${commentId}`);
  },

  // Upload task attachment
  uploadTaskAttachment: async (
    taskId: number,
    file: File
  ): Promise<{
    taskId: number;
    attachments: TaskAttachment[];
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload(`/tasks/${taskId}/attachments`, formData);
    return response.data as {
      taskId: number;
      attachments: TaskAttachment[];
    };
  },

  // Delete task attachment
  deleteTaskAttachment: async (
    taskId: number,
    attachmentId: string
  ): Promise<{ taskId: number; attachmentId: string }> => {
    await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
    return { taskId, attachmentId };
  },

  // Get kanban columns
  getColumns: async (boardId: number): Promise<KanbanColumn[]> => {
    const response = await api.get<KanbanColumn[]>(`/kanban/boards/${boardId}/columns`);
    return response.data;
  },

  // Create kanban column
  createColumn: async (columnData: CreateColumnData): Promise<KanbanColumn> => {
    const response = await api.post<KanbanColumn>('/kanban/columns', columnData);
    return response.data;
  },

  // Update kanban column
  updateColumn: async (
    columnId: number,
    columnData: UpdateColumnData
  ): Promise<KanbanColumn> => {
    const response = await api.patch<KanbanColumn>(`/kanban/columns/${columnId}`, columnData);
    return response.data;
  },

  // Delete kanban column
  deleteColumn: async (columnId: number): Promise<void> => {
    await api.delete(`/kanban/columns/${columnId}`);
  },
};

export default taskService;
