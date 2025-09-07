// Column Type enum
export enum ColumnType {
  CUSTOM = 'custom',
  SYSTEM = 'system',
}

// Column Color enum
export enum ColumnColor {
  BLUE = 'blue',
  GREEN = 'green',
  YELLOW = 'yellow',
  RED = 'red',
  PURPLE = 'purple',
  ORANGE = 'orange',
  GRAY = 'gray',
  PINK = 'pink',
}

// Kanban Board interface - matching backend entity
export interface KanbanBoard {
  id: number;
  name: string;
  description?: string;
  projectId: number;
  createdById: number;
  settings?: {
    allowColumnCreation?: boolean;
    allowColumnDeletion?: boolean;
    allowColumnReordering?: boolean;
    defaultColumns?: string[];
    maxColumns?: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Kanban Column interface - matching backend entity
export interface KanbanColumn {
  id: number;
  name: string;
  description?: string;
  boardId: number;
  type: ColumnType;
  color: ColumnColor;
  order: number;
  maxTasks: number;
  isActive: boolean;
  isWipLimit: boolean;
  wipSettings?: {
    limit?: number;
    warningThreshold?: number;
    color?: string;
  };
  rules?: {
    allowTaskCreation?: boolean;
    allowTaskMovement?: boolean;
    requiredFields?: string[];
    autoAssign?: boolean;
    defaultAssignee?: string;
  };
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}
