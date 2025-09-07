import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { dashboardService, DashboardData, DashboardStats } from '@/services/dashboardService';
import { Task, Project } from '@/types/api';

// Helper function to extract error message
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error instanceof Error && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message || defaultMessage;
  }
  return defaultMessage;
};

// Dashboard state interface
interface DashboardState {
  stats: DashboardStats | null;
  assignedTasks: Task[];
  recentProjects: Project[];
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
}

// Initial state
const initialState: DashboardState = {
  stats: null,
  assignedTasks: [],
  recentProjects: [],
  isLoading: false,
  error: null,
  lastFetched: null,
};

// Async thunks
export const fetchDashboardData = createAsyncThunk<
  DashboardData,
  void,
  { rejectValue: string }
>(
  'dashboard/fetchDashboardData',
  async (_, { rejectWithValue }) => {
    try {
      const data = await dashboardService.getDashboardData();
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch dashboard data'));
    }
  }
);

export const fetchAssignedTasks = createAsyncThunk<
  Task[],
  number | undefined,
  { rejectValue: string }
>(
  'dashboard/fetchAssignedTasks',
  async (limit = 10, { rejectWithValue }) => {
    try {
      const tasks = await dashboardService.getAssignedTasks(limit);
      return tasks;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch assigned tasks'));
    }
  }
);

export const fetchRecentProjects = createAsyncThunk<
  Project[],
  number | undefined,
  { rejectValue: string }
>(
  'dashboard/fetchRecentProjects',
  async (limit = 6, { rejectWithValue }) => {
    try {
      const projects = await dashboardService.getRecentProjects(limit);
      return projects;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch recent projects'));
    }
  }
);

// Dashboard slice
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearDashboard: (state) => {
      state.stats = null;
      state.assignedTasks = [];
      state.recentProjects = [];
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch dashboard data
      .addCase(fetchDashboardData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload.stats;
        state.assignedTasks = action.payload.assignedTasks;
        state.recentProjects = action.payload.recentProjects;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch dashboard data';
      })
      
      // Fetch assigned tasks
      .addCase(fetchAssignedTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAssignedTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.assignedTasks = action.payload;
      })
      .addCase(fetchAssignedTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch assigned tasks';
      })
      
      // Fetch recent projects
      .addCase(fetchRecentProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRecentProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.recentProjects = action.payload;
      })
      .addCase(fetchRecentProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch recent projects';
      });
  },
});

// Actions
export const { clearError, clearDashboard } = dashboardSlice.actions;

// Selectors
export const selectDashboardStats = (state: { dashboard: DashboardState }) => state.dashboard.stats;
export const selectAssignedTasks = (state: { dashboard: DashboardState }) => state.dashboard.assignedTasks;
export const selectRecentProjects = (state: { dashboard: DashboardState }) => state.dashboard.recentProjects;
export const selectDashboardLoading = (state: { dashboard: DashboardState }) => state.dashboard.isLoading;
export const selectDashboardError = (state: { dashboard: DashboardState }) => state.dashboard.error;
export const selectLastFetched = (state: { dashboard: DashboardState }) => state.dashboard.lastFetched;

// Reducer
export default dashboardSlice.reducer;
