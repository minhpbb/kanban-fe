import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { KanbanBoard, KanbanColumn } from '@/types/kanban-board';
import { kanbanService, CreateKanbanBoardData, UpdateKanbanBoardData, CreateKanbanColumnData, UpdateKanbanColumnData, ReorderColumnsData } from '@/services';

// Helper function to extract error message
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error instanceof Error && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message || defaultMessage;
  }
  return defaultMessage;
};

// Kanban state interface
interface KanbanState {
  boards: KanbanBoard[];
  currentBoard: KanbanBoard | null;
  columns: KanbanColumn[];
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: KanbanState = {
  boards: [],
  currentBoard: null,
  columns: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchProjectBoards = createAsyncThunk(
  'kanban/fetchProjectBoards',
  async (projectId: number, { rejectWithValue }) => {
    try {
      return await kanbanService.getProjectBoards(projectId);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch project boards'));
    }
  }
);

export const fetchBoardById = createAsyncThunk(
  'kanban/fetchBoardById',
  async (boardId: number, { rejectWithValue }) => {
    try {
      return await kanbanService.getBoardById(boardId);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch board'));
    }
  }
);

export const createBoard = createAsyncThunk(
  'kanban/createBoard',
  async ({ projectId, data }: { projectId: number; data: CreateKanbanBoardData }, { rejectWithValue }) => {
    try {
      return await kanbanService.createBoard(projectId, data);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to create board'));
    }
  }
);

export const updateBoard = createAsyncThunk(
  'kanban/updateBoard',
  async ({ boardId, data }: { boardId: number; data: UpdateKanbanBoardData }, { rejectWithValue }) => {
    try {
      return await kanbanService.updateBoard(boardId, data);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to update board'));
    }
  }
);

export const deleteBoard = createAsyncThunk(
  'kanban/deleteBoard',
  async (boardId: number, { rejectWithValue }) => {
    try {
      await kanbanService.deleteBoard(boardId);
      return boardId;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to delete board'));
    }
  }
);

export const fetchBoardColumns = createAsyncThunk(
  'kanban/fetchBoardColumns',
  async (boardId: number, { rejectWithValue }) => {
    try {
      return await kanbanService.getBoardColumns(boardId);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch board columns'));
    }
  }
);

export const createColumn = createAsyncThunk(
  'kanban/createColumn',
  async ({ boardId, data }: { boardId: number; data: CreateKanbanColumnData }, { rejectWithValue }) => {
    try {
      return await kanbanService.createColumn(boardId, data);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to create column'));
    }
  }
);

export const updateColumn = createAsyncThunk(
  'kanban/updateColumn',
  async ({ columnId, data }: { columnId: number; data: UpdateKanbanColumnData }, { rejectWithValue }) => {
    try {
      return await kanbanService.updateColumn(columnId, data);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to update column'));
    }
  }
);

export const deleteColumn = createAsyncThunk(
  'kanban/deleteColumn',
  async (columnId: number, { rejectWithValue }) => {
    try {
      await kanbanService.deleteColumn(columnId);
      return columnId;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to delete column'));
    }
  }
);

export const reorderColumns = createAsyncThunk(
  'kanban/reorderColumns',
  async ({ boardId, data }: { boardId: number; data: ReorderColumnsData }, { rejectWithValue }) => {
    try {
      await kanbanService.reorderColumns(boardId, data);
      return data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to reorder columns'));
    }
  }
);

// Kanban slice
const kanbanSlice = createSlice({
  name: 'kanban',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentBoard: (state, action: PayloadAction<KanbanBoard | null>) => {
      state.currentBoard = action.payload;
    },
    updateBoardInList: (state, action: PayloadAction<KanbanBoard>) => {
      const index = state.boards.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.boards[index] = action.payload;
      }
      if (state.currentBoard?.id === action.payload.id) {
        state.currentBoard = action.payload;
      }
    },
    removeBoardFromList: (state, action: PayloadAction<number>) => {
      state.boards = state.boards.filter(b => b.id !== action.payload);
      if (state.currentBoard?.id === action.payload) {
        state.currentBoard = null;
      }
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
      // Fetch project boards
      .addCase(fetchProjectBoards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectBoards.fulfilled, (state, action) => {
        state.isLoading = false;
        state.boards = action.payload.boards;
      })
      .addCase(fetchProjectBoards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch board by ID
      .addCase(fetchBoardById.fulfilled, (state, action) => {
        state.currentBoard = action.payload as KanbanBoard;
      })
      
      // Create board
      .addCase(createBoard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBoard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.boards.push(action.payload as KanbanBoard);
      })
      .addCase(createBoard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update board
      .addCase(updateBoard.fulfilled, (state, action) => {
        const payload = action.payload as KanbanBoard;
        const index = state.boards.findIndex(b => b.id === payload.id);
        if (index !== -1) {
          state.boards[index] = payload;
        }
        if (state.currentBoard?.id === payload.id) {
          state.currentBoard = payload;
        }
      })
      
      // Delete board
      .addCase(deleteBoard.fulfilled, (state, action) => {
        state.boards = state.boards.filter(b => b.id !== action.payload);
        if (state.currentBoard?.id === action.payload) {
          state.currentBoard = null;
        }
      })
      
      // Fetch board columns
      .addCase(fetchBoardColumns.fulfilled, (state, action) => {
        console.log('fetchBoardColumns.fulfilled:', action.payload);
        state.columns = action.payload.columns || action.payload;
        console.log('Updated state.columns:', state.columns);
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
      })
      
      // Reorder columns
      .addCase(reorderColumns.fulfilled, (state, action) => {
        const { columnOrders } = action.payload;
        columnOrders.forEach(({ columnId, order }) => {
          const column = state.columns.find(c => c.id === columnId);
          if (column) {
            column.order = order;
          }
        });
        // Sort columns by order
        state.columns.sort((a, b) => a.order - b.order);
      });
  },
});

export const {
  clearError,
  setCurrentBoard,
  updateBoardInList,
  removeBoardFromList,
  updateColumnInList,
  removeColumnFromList,
} = kanbanSlice.actions;
export default kanbanSlice.reducer;
