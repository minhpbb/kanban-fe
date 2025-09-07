// Export all services
export { default as authService } from './authService';
export { default as projectService } from './projectService';
export { default as taskService } from './taskService';
export { default as notificationService } from './notificationService';
export { default as kanbanService } from './kanbanService';
export { dashboardService } from './dashboardService';
export { userService } from './userService';

// Re-export types
export type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  RefreshTokenResponse,
  ChangePasswordData,
  UpdateProfileData,
} from './authService';

export type {
  CreateProjectData,
  UpdateProjectData,
  ProjectListParams,
  AddMemberData,
  ProjectOverview,
  ProjectStatistics,
  ProjectActivity,
} from './projectService';

// Re-export enums from types
export { ProjectRole } from '@/types/project';

export type {
  CreateTaskData,
  UpdateTaskData,
  TaskListParams,
  MoveTaskData,
  AddCommentData,
  UpdateCommentData,
  TaskAttachment,
  CreateColumnData,
  UpdateColumnData,
} from './taskService';

export type {
  NotificationListParams,
  MarkAsReadResponse,
  UnreadCountResponse,
} from './notificationService';

export type {
  CreateKanbanBoardData,
  UpdateKanbanBoardData,
  CreateKanbanColumnData,
  UpdateKanbanColumnData,
  ReorderColumnsData,
} from './kanbanService';

export type {
  DashboardStats,
  DashboardData,
} from './dashboardService';

export type {
  SearchUsersParams,
} from './userService';

// Re-export SSE service
export { default as sseService } from './sseService';
