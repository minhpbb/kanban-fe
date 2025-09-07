import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// UI state interface
interface UIState {
  // Modal states
  modals: {
    taskForm: boolean;
    columnForm: boolean;
    taskDetail: boolean;
    projectForm: boolean;
    confirmDelete: boolean;
  };
  
  // Loading states
  loading: {
    global: boolean;
    tasks: boolean;
    projects: boolean;
    notifications: boolean;
  };
  
  // View modes
  viewModes: {
    taskView: 'table' | 'kanban';
    projectView: 'grid' | 'list';
  };
  
  // Sidebar state
  sidebar: {
    collapsed: boolean;
    mobileOpen: boolean;
  };
  
  // Theme
  theme: 'light' | 'dark';
  
  // Notifications
  toast: {
    message: string | null;
    type: 'success' | 'error' | 'warning' | 'info';
    visible: boolean;
  };
  
  // Filters and search
  filters: {
    search: string;
    dateRange: {
      start: string | null;
      end: string | null;
    };
  };
}

// Initial state
const initialState: UIState = {
  modals: {
    taskForm: false,
    columnForm: false,
    taskDetail: false,
    projectForm: false,
    confirmDelete: false,
  },
  loading: {
    global: false,
    tasks: false,
    projects: false,
    notifications: false,
  },
  viewModes: {
    taskView: 'kanban',
    projectView: 'grid',
  },
  sidebar: {
    collapsed: false,
    mobileOpen: false,
  },
  theme: 'light',
  toast: {
    message: null,
    type: 'info',
    visible: false,
  },
  filters: {
    search: '',
    dateRange: {
      start: null,
      end: null,
    },
  },
};

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Modal actions
    openModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = false;
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key as keyof UIState['modals']] = false;
      });
    },
    
    // Loading actions
    setLoading: (state, action: PayloadAction<{ key: keyof UIState['loading']; value: boolean }>) => {
      state.loading[action.payload.key] = action.payload.value;
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload;
    },
    
    // View mode actions
    setTaskViewMode: (state, action: PayloadAction<'table' | 'kanban'>) => {
      state.viewModes.taskView = action.payload;
    },
    setProjectViewMode: (state, action: PayloadAction<'grid' | 'list'>) => {
      state.viewModes.projectView = action.payload;
    },
    
    // Sidebar actions
    toggleSidebar: (state) => {
      state.sidebar.collapsed = !state.sidebar.collapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebar.collapsed = action.payload;
    },
    toggleMobileSidebar: (state) => {
      state.sidebar.mobileOpen = !state.sidebar.mobileOpen;
    },
    setMobileSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebar.mobileOpen = action.payload;
    },
    
    // Theme actions
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', action.payload);
      }
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', state.theme);
      }
    },
    
    // Toast actions
    showToast: (state, action: PayloadAction<{ message: string; type: 'success' | 'error' | 'warning' | 'info' }>) => {
      state.toast = {
        message: action.payload.message,
        type: action.payload.type,
        visible: true,
      };
    },
    hideToast: (state) => {
      state.toast.visible = false;
      state.toast.message = null;
    },
    
    // Filter actions
    setSearch: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
    },
    setDateRange: (state, action: PayloadAction<{ start: string | null; end: string | null }>) => {
      state.filters.dateRange = action.payload;
    },
    clearFilters: (state) => {
      state.filters.search = '';
      state.filters.dateRange = { start: null, end: null };
    },
    
    // Initialize from localStorage
    initializeFromStorage: (state) => {
      if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
        if (savedTheme) {
          state.theme = savedTheme;
        }
        
        const savedSidebarCollapsed = localStorage.getItem('sidebarCollapsed');
        if (savedSidebarCollapsed) {
          state.sidebar.collapsed = JSON.parse(savedSidebarCollapsed);
        }
        
        const savedTaskViewMode = localStorage.getItem('taskViewMode') as 'table' | 'kanban';
        if (savedTaskViewMode) {
          state.viewModes.taskView = savedTaskViewMode;
        }
      }
    },
  },
});

export const {
  openModal,
  closeModal,
  closeAllModals,
  setLoading,
  setGlobalLoading,
  setTaskViewMode,
  setProjectViewMode,
  toggleSidebar,
  setSidebarCollapsed,
  toggleMobileSidebar,
  setMobileSidebarOpen,
  setTheme,
  toggleTheme,
  showToast,
  hideToast,
  setSearch,
  setDateRange,
  clearFilters,
  initializeFromStorage,
} = uiSlice.actions;
export default uiSlice.reducer;
