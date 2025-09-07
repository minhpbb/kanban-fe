import { CreateColumnData, CreateTaskData, TaskListParams, taskService, UpdateColumnData, UpdateTaskData } from '@/services';
import { commentService } from '@/services/commentService';
import { Task, Comment } from '@/types/task';
import { KanbanColumn } from '@/types/kanban-board';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

// Helper function to extract error message
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error instanceof Error && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message || defaultMessage;
  }
  return defaultMessage;
};

// Task state interface
interface TaskState {
  tasks: Task[];
  columns: KanbanColumn[];
  currentTask: Task | null;
  comments: Record<number, Comment[]>; // taskId -> comments
  isLoading: boolean;
  error: string | null;
  filters: {
    projectId?: number;
    assigneeId?: number;
    priority?: string;
    status?: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Initial state
const initialState: TaskState = {
  tasks: [],
  columns: [],
  currentTask: null,
  comments: {},
  isLoading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

// Async thunks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (params: TaskListParams = {}, { rejectWithValue }) => {
    try {
      if (!params.projectId) {
        throw new Error('Project ID is required');
      }
      return await taskService.getTasksByProject(params.projectId, params);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch tasks'));
    }
  }
);

export const fetchTaskById = createAsyncThunk(
  'tasks/fetchTaskById',
  async (taskId: number, { rejectWithValue }) => {
    try {
      return await taskService.getTaskById(taskId);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch task'));
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: CreateTaskData, { rejectWithValue }) => {
    try {
      return await taskService.createTask(taskData);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to create task'));
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, data }: { id: number; data: UpdateTaskData }, { rejectWithValue }) => {
    try {
      return await taskService.updateTask(id, data);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to update task'));
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId: number, { rejectWithValue }) => {
    try {
      await taskService.deleteTask(taskId);
      return taskId;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to delete task'));
    }
  }
);

export const moveTask = createAsyncThunk(
  'tasks/moveTask',
  async ({ taskId, targetColumnId, newOrder }: { taskId: number; targetColumnId: number; newOrder?: number }, { rejectWithValue }) => {
    try {
      return await taskService.moveTask(taskId, { targetColumnId, newOrder });
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to move task'));
    }
  }
);

export const addTaskComment = createAsyncThunk(
  'tasks/addTaskComment',
  async ({ taskId, content }: { taskId: number; content: string }, { rejectWithValue }) => {
    try {
      return await commentService.addTaskComment(taskId, { content });
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to add comment'));
    }
  }
);

// Async thunk to get task comments
export const getTaskComments = createAsyncThunk<
  Comment[],
  number,
  { rejectValue: string }
>(
  'tasks/getTaskComments',
  async (taskId, { rejectWithValue }) => {
    try {
      const response = await commentService.getTaskComments(taskId);
      return response.comments;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch comments'));
    }
  }
);

// Async thunk to update task comment
export const updateTaskComment = createAsyncThunk<
  { message: string },
  { taskId: number; commentId: number; content: string },
  { rejectValue: string }
>(
  'tasks/updateTaskComment',
  async ({ taskId, commentId, content }, { rejectWithValue }) => {
    try {
      const response = await commentService.updateTaskComment(taskId, commentId, { content });
      return response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to update comment'));
    }
  }
);

// Async thunk to delete task comment
export const deleteTaskComment = createAsyncThunk<
  { message: string },
  { taskId: number; commentId: number },
  { rejectValue: string }
>(
  'tasks/deleteTaskComment',
  async ({ taskId, commentId }, { rejectWithValue }) => {
    try {
      const response = await commentService.deleteTaskComment(taskId, commentId);
      return response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to delete comment'));
    }
  }
);

export const uploadTaskAttachment = createAsyncThunk(
  'tasks/uploadTaskAttachment',
  async ({ taskId, file }: { taskId: number; file: File }, { rejectWithValue }) => {
    try {
      return await taskService.uploadTaskAttachment(taskId, file);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to upload attachment'));
    }
  }
);

export const deleteTaskAttachment = createAsyncThunk(
  'tasks/deleteTaskAttachment',
  async ({ taskId, attachmentId }: { taskId: number; attachmentId: string }, { rejectWithValue }) => {
    try {
      return await taskService.deleteTaskAttachment(taskId, attachmentId);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to delete attachment'));
    }
  }
);

export const fetchColumns = createAsyncThunk(
  'tasks/fetchColumns',
  async (boardId: number, { rejectWithValue }) => {
    try {
      return await taskService.getColumns(boardId);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch columns'));
    }
  }
);

export const createColumn = createAsyncThunk(
  'tasks/createColumn',
  async (columnData: CreateColumnData, { rejectWithValue }) => {
    try {
      return await taskService.createColumn(columnData);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to create column'));
    }
  }
);

export const updateColumn = createAsyncThunk(
  'tasks/updateColumn',
  async ({ id, data }: { id: number; data: UpdateColumnData }, { rejectWithValue }) => {
    try {
      return await taskService.updateColumn(id, data);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to update column'));
    }
  }
);

export const deleteColumn = createAsyncThunk(
  'tasks/deleteColumn',
  async (columnId: number, { rejectWithValue }) => {
    try {
      await taskService.deleteColumn(columnId);
      return columnId;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to delete column'));
    }
  }
);

// Task slice
const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentTask: (state, action: PayloadAction<Task | null>) => {
      state.currentTask = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<TaskState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    updateTaskInList: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },
    addTaskToList: (state, action: PayloadAction<Task>) => {
      state.tasks.push(action.payload);
    },
    removeTaskFromList: (state, action: PayloadAction<number>) => {
      state.tasks = state.tasks.filter(t => t.id !== action.payload);
    },
    updateColumnInList: (state, action: PayloadAction<KanbanColumn>) => {
      const index = state.columns.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.columns[index] = action.payload;
      }
    },
    removeColumnFromList: (state, action: PayloadAction<number>) => {
      state.columns = state.columns.filter(c => c.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tasks
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        console.log('fetchTasks.fulfilled:', action.payload);
        const payload = action.payload as {
          tasks?: Task[];
          page?: number;
          limit?: number;
          total?: number;
          totalPages?: number;
        } | Task[];
        
        if (Array.isArray(payload)) {
          state.tasks = payload;
          state.pagination = {
            page: 1,
            limit: 10,
            total: payload.length,
            totalPages: Math.ceil(payload.length / 10),
          };
        } else {
          state.tasks = payload.tasks || (Array.isArray(payload) ? payload : []);
          state.pagination = {
            page: payload.page || 1,
            limit: payload.limit || 10,
            total: payload.total || payload.tasks?.length || 0,
            totalPages: payload.totalPages || Math.ceil((payload.total || payload.tasks?.length || 0) / (payload.limit || 10)),
          };
        }
        console.log('Updated state.tasks:', state.tasks);
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch task by ID
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.currentTask = action.payload as Task;
      })
      
      // Create task
      .addCase(createTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks.unshift(action.payload as Task);
        state.pagination.total += 1;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update task
      .addCase(updateTask.fulfilled, (state, action) => {
        const payload = action.payload as Task;
        const index = state.tasks.findIndex(t => t.id === payload.id);
        if (index !== -1) {
          state.tasks[index] = payload;
        }
        if (state.currentTask?.id === payload.id) {
          state.currentTask = payload;
        }
      })
      
      // Delete task
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(t => t.id !== action.payload);
        if (state.currentTask?.id === action.payload) {
          state.currentTask = null;
        }
        state.pagination.total -= 1;
      })
      
      // Move task
      .addCase(moveTask.fulfilled, (state, action) => {
        const payload = action.payload as Task;
        const index = state.tasks.findIndex(t => t.id === payload.id);
        if (index !== -1) {
          state.tasks[index] = payload;
        }
        if (state.currentTask?.id === payload.id) {
          state.currentTask = payload;
        }
      })
      
      // Add comment
      .addCase(addTaskComment.fulfilled, () => {
        // The backend doesn't return comments, so we just mark success
        // Comments will be refetched when needed
      })
      
      // Get task comments
      .addCase(getTaskComments.fulfilled, (state, action) => {
        const taskId = action.meta.arg;
        state.comments[taskId] = action.payload;
      })
      
      // Update task comment
      .addCase(updateTaskComment.fulfilled, () => {
        // Comments will be refetched when needed
      })
      
      // Delete task comment
      .addCase(deleteTaskComment.fulfilled, () => {
        // Comments will be refetched when needed
      })
      
      // Upload attachment
      .addCase(uploadTaskAttachment.fulfilled, (state, action) => {
        const payload = action.payload as { taskId: number; attachments: unknown[] };
        const index = state.tasks.findIndex(t => t.id === payload.taskId);
        if (index !== -1) {
          (state.tasks[index] as Record<string, unknown>).attachments = payload.attachments;
        }
        if (state.currentTask?.id === payload.taskId) {
          (state.currentTask as Record<string, unknown>).attachments = payload.attachments;
        }
      })
      
      // Delete attachment
      .addCase(deleteTaskAttachment.fulfilled, (state, action) => {
        const payload = action.payload as { taskId: number; attachmentId: string };
        const index = state.tasks.findIndex(t => t.id === payload.taskId);
        if (index !== -1) {
          state.tasks[index].attachments = state.tasks[index].attachments?.filter(
            att => att.filename !== payload.attachmentId
          );
        }
        if (state.currentTask?.id === payload.taskId) {
          state.currentTask.attachments = state.currentTask.attachments?.filter(
            att => att.filename !== payload.attachmentId
          );
        }
      })
      
      // Fetch columns
      .addCase(fetchColumns.fulfilled, (state, action) => {
        state.columns = action.payload as KanbanColumn[];
      })
      
      // Create column
      .addCase(createColumn.fulfilled, (state, action) => {
        state.columns.push(action.payload as KanbanColumn);
      })
      
      // Update column
      .addCase(updateColumn.fulfilled, (state, action) => {
        const payload = action.payload as KanbanColumn;
        const index = state.columns.findIndex(c => c.id === payload.id);
        if (index !== -1) {
          state.columns[index] = payload;
        }
      })
      
      // Delete column
      .addCase(deleteColumn.fulfilled, (state, action) => {
        state.columns = state.columns.filter(c => c.id !== action.payload);
      });
  },
});

export const {
  clearError,
  setCurrentTask,
  setFilters,
  clearFilters,
  updateTaskInList,
  removeTaskFromList,
  updateColumnInList,
  removeColumnFromList,
} = taskSlice.actions;
export default taskSlice.reducer;
