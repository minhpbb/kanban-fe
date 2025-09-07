import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Project } from '@/types/project';
import { projectService, CreateProjectData, UpdateProjectData, ProjectListParams, AddMemberData } from '@/services';

// Helper function to extract error message
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error instanceof Error && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message || defaultMessage;
  }
  return defaultMessage;
};

// Project state interface
interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Initial state
const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

// Async thunks
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (params: ProjectListParams = {}, { rejectWithValue }) => {
    try {
      return await projectService.getProjects(params);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch projects'));
    }
  }
);

export const fetchProjectById = createAsyncThunk(
  'projects/fetchProjectById',
  async (projectId: number, { rejectWithValue }) => {
    try {
      return await projectService.getProjectById(projectId);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch project'));
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (projectData: CreateProjectData, { rejectWithValue }) => {
    try {
      return await projectService.createProject(projectData);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to create project'));
    }
  }
);

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ id, data }: { id: number; data: UpdateProjectData }, { rejectWithValue }) => {
    try {
      return await projectService.updateProject(id, data);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to update project'));
    }
  }
);

export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (projectId: number, { rejectWithValue }) => {
    try {
      const result = await projectService.deleteProject(projectId);
      return { projectId, message: result.message };
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to delete project'));
    }
  }
);

export const addProjectMember = createAsyncThunk(
  'projects/addProjectMember',
  async ({ projectId, data }: { projectId: number; data: AddMemberData }, { rejectWithValue }) => {
    try {
      const result = await projectService.addProjectMember(projectId, data);
      return { projectId, data, message: result.message };
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to add member'));
    }
  }
);

export const removeProjectMember = createAsyncThunk(
  'projects/removeProjectMember',
  async ({ projectId, userId }: { projectId: number; userId: number }, { rejectWithValue }) => {
    try {
      const result = await projectService.removeProjectMember(projectId, userId);
      return { projectId, userId, message: result.message };
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to remove member'));
    }
  }
);

export const getProjectMembers = createAsyncThunk(
  'projects/getProjectMembers',
  async (projectId: number, { rejectWithValue }) => {
    try {
      const result = await projectService.getProjectMembers(projectId);
      return result;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to get project members'));
    }
  }
);

export const getProjectOverview = createAsyncThunk(
  'projects/getProjectOverview',
  async (projectId: number, { rejectWithValue }) => {
    try {
      return await projectService.getProjectOverview(projectId);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to get project overview'));
    }
  }
);

export const getProjectStatistics = createAsyncThunk(
  'projects/getProjectStatistics',
  async ({ projectId, period }: { projectId: number; period?: string }, { rejectWithValue }) => {
    try {
      return await projectService.getProjectStatistics(projectId, period);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to get project statistics'));
    }
  }
);

export const getProjectActivities = createAsyncThunk(
  'projects/getProjectActivities',
  async ({ projectId, limit, type }: { projectId: number; limit?: number; type?: string }, { rejectWithValue }) => {
    try {
      return await projectService.getProjectActivities(projectId, { limit, type });
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to get project activities'));
    }
  }
);

// Project slice
const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload;
    },
    updateProjectInList: (state, action: PayloadAction<Project>) => {
      const index = state.projects.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = action.payload;
      }
    },
    removeProjectFromList: (state, action: PayloadAction<number>) => {
      state.projects = state.projects.filter(p => p.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch projects
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload as {
          projects?: Project[];
          page?: number;
          limit?: number;
          total?: number;
          totalPages?: number;
        } | Project[];
        
        if (Array.isArray(payload)) {
          state.projects = payload;
          state.pagination = {
            page: 1,
            limit: 10,
            total: payload.length,
            totalPages: Math.ceil(payload.length / 10),
          };
        } else {
          state.projects = payload.projects || [];
          state.pagination = {
            page: payload.page || 1,
            limit: payload.limit || 10,
            total: payload.total || payload.projects?.length || 0,
            totalPages: payload.totalPages || Math.ceil((payload.total || payload.projects?.length || 0) / (payload.limit || 10)),
          };
        }
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch project by ID
      .addCase(fetchProjectById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProject = action.payload as Project;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create project
      .addCase(createProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects.unshift(action.payload as Project);
        state.pagination.total += 1;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update project
      .addCase(updateProject.fulfilled, (state, action) => {
        const payload = action.payload as Project;
        const index = state.projects.findIndex(p => p.id === payload.id);
        if (index !== -1) {
          state.projects[index] = payload;
        }
        if (state.currentProject?.id === payload.id) {
          state.currentProject = payload;
        }
      })
      
      // Delete project
      .addCase(deleteProject.fulfilled, (state, action) => {
        const { projectId } = action.payload;
        state.projects = state.projects.filter(p => p.id !== projectId);
        if (state.currentProject?.id === projectId) {
          state.currentProject = null;
        }
        state.pagination.total -= 1;
      });
  },
});

export const { clearError, setCurrentProject, updateProjectInList, removeProjectFromList } = projectSlice.actions;
export default projectSlice.reducer;
