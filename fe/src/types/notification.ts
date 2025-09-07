// Notification interfaces
export enum NotificationType {
  PROJECT_INVITE = 'project_invite',
  PROJECT_MEMBER_ADDED = 'project_member_added',
  PROJECT_MEMBER_REMOVED = 'project_member_removed',
  TASK_ASSIGNED = 'task_assigned',
  TASK_UNASSIGNED = 'task_unassigned',
  TASK_MOVED = 'task_moved',
  TASK_COMMENTED = 'task_commented',
  TASK_CREATED = 'task_created',
  TASK_UPDATED = 'task_updated',
  TASK_DELETED = 'task_deleted',
  TASK_FILE_UPLOADED = 'task_file_uploaded',
  TASK_DUE_SOON = 'task_due_soon',
  TASK_OVERDUE = 'task_overdue',
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
}

export interface Notification {
  id: number;
  userId: number;
  projectId?: number;
  taskId?: number;
  fromUserId?: number;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  metadata?: {
    projectName?: string;
    taskTitle?: string;
    fromUserName?: string;
    fromUserAvatar?: string;
    columnName?: string;
    oldColumnName?: string;
    role?: string;
    fileName?: string;
    [key: string]: unknown;
  };
  readAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}
