import api from '@/lib/api';
import { KanbanBoard, KanbanColumn, ColumnType, ColumnColor } from '@/types/kanban-board';

// Kanban service interfaces
export interface CreateKanbanBoardData {
  name: string;
  description?: string;
  settings?: {
    allowColumnCreation?: boolean;
    allowColumnDeletion?: boolean;
    allowColumnReordering?: boolean;
    defaultColumns?: string[];
    maxColumns?: number;
  };
}

export interface UpdateKanbanBoardData {
  name?: string;
  description?: string;
  settings?: {
    allowColumnCreation?: boolean;
    allowColumnDeletion?: boolean;
    allowColumnReordering?: boolean;
    defaultColumns?: string[];
    maxColumns?: number;
  };
}

export interface CreateKanbanColumnData {
  name: string;
  description?: string;
  type: ColumnType;
  color: ColumnColor;
  order: number;
  maxTasks?: number;
  isWipLimit?: boolean;
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
}

export interface UpdateKanbanColumnData {
  name?: string;
  description?: string;
  type?: ColumnType;
  color?: ColumnColor;
  order?: number;
  maxTasks?: number;
  isActive?: boolean;
  isWipLimit?: boolean;
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
}

export interface ReorderColumnsData {
  columnOrders: Array<{
    columnId: number;
    order: number;
  }>;
}

// Kanban service
export const kanbanService = {
  // ========== KANBAN BOARD METHODS ==========

  // Get project boards
  getProjectBoards: async (projectId: number): Promise<{
    boards: KanbanBoard[];
  }> => {
    const response = await api.get(`/kanban/projects/${projectId}/boards`);
    return response.data as {
      boards: KanbanBoard[];
    };
  },

  // Get board by ID
  getBoardById: async (boardId: number): Promise<KanbanBoard> => {
    const response = await api.get<KanbanBoard>(`/kanban/boards/${boardId}`);
    return response.data;
  },

  // Create board
  createBoard: async (
    projectId: number,
    boardData: CreateKanbanBoardData
  ): Promise<KanbanBoard> => {
    const response = await api.post<KanbanBoard>(`/kanban/projects/${projectId}/boards`, boardData);
    return response.data;
  },

  // Update board
  updateBoard: async (
    boardId: number,
    boardData: UpdateKanbanBoardData
  ): Promise<KanbanBoard> => {
    const response = await api.patch<KanbanBoard>(`/kanban/boards/${boardId}`, boardData);
    return response.data;
  },

  // Delete board
  deleteBoard: async (boardId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/kanban/boards/${boardId}`);
    return response.data;
  },

  // ========== KANBAN COLUMN METHODS ==========

  // Get board columns
  getBoardColumns: async (boardId: number): Promise<{
    columns: KanbanColumn[];
  }> => {
    const response = await api.get(`/kanban/boards/${boardId}/columns`);
    const data = response.data as { columns?: KanbanColumn[] } | KanbanColumn[];
    
    // Handle both formats: { columns: [...] } or direct array
    if (data && typeof data === 'object' && 'columns' in data && data.columns) {
      return { columns: data.columns };
    } else if (Array.isArray(data)) {
      return { columns: data };
    } else {
      return { columns: [] };
    }
  },

  // Get column by ID
  getColumnById: async (columnId: number): Promise<KanbanColumn> => {
    const response = await api.get<KanbanColumn>(`/kanban/columns/${columnId}`);
    return response.data;
  },

  // Create column
  createColumn: async (
    boardId: number,
    columnData: CreateKanbanColumnData
  ): Promise<KanbanColumn> => {
    const response = await api.post<KanbanColumn>(`/kanban/boards/${boardId}/columns`, columnData);
    return response.data;
  },

  // Update column
  updateColumn: async (
    columnId: number,
    columnData: UpdateKanbanColumnData
  ): Promise<KanbanColumn> => {
    const response = await api.patch<KanbanColumn>(`/kanban/columns/${columnId}`, columnData);
    return response.data;
  },

  // Delete column
  deleteColumn: async (columnId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/kanban/columns/${columnId}`);
    return response.data;
  },

  // Reorder columns
  reorderColumns: async (
    boardId: number,
    reorderData: ReorderColumnsData
  ): Promise<{ message: string }> => {
    const response = await api.patch<{ message: string }>(`/kanban/boards/${boardId}/columns/reorder`, reorderData);
    return response.data;
  },
};

export default kanbanService;
