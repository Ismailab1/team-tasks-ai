import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../services/apiClient';

// Types
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  members: TeamMember[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  assigned_to: string[];
  due_date: string;
  team_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  created_by: string;
  content: string;
  team_id: string;
  created_at: string;
}

interface TeamsState {
  teams: Team[];
  tasks: Task[];
  reports: Report[];
  activeTeam: Team | null;
  personalTasks: Task[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: TeamsState = {
  teams: [],
  tasks: [],
  reports: [],
  activeTeam: null,
  personalTasks: [],
  status: 'idle',
  error: null
};

// Thunks
export const fetchTeams = createAsyncThunk(
  'teams/fetchTeams',
  async (_, { rejectWithValue }) => {
    try {
      // For development, use sample data
      if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        return mockTeams;
      }
      
      const response = await apiClient.get('/teams');
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch teams');
    }
  }
);

export const fetchTasks = createAsyncThunk(
  'teams/fetchTasks',
  async (teamId: string | null, { rejectWithValue }) => {
    try {
      // For development, use sample data
      if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        if (teamId) {
          return mockTasks.filter(task => task.team_id === teamId);
        }
        return mockTasks;
      }
      
      const endpoint = teamId ? `/teams/${teamId}/tasks` : '/tasks';
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch tasks');
    }
  }
);

export const fetchReports = createAsyncThunk(
  'teams/fetchReports',
  async (teamId: string | null, { rejectWithValue }) => {
    try {
      // For development, use sample data
      if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        if (teamId) {
          return mockReports.filter(report => report.team_id === teamId);
        }
        return mockReports;
      }
      
      const endpoint = teamId ? `/teams/${teamId}/reports` : '/reports';
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch reports');
    }
  }
);

export const fetchPersonalTasks = createAsyncThunk(
  'teams/fetchPersonalTasks',
  async (userId: string, { rejectWithValue }) => {
    try {
      // For development, use sample data
      if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        return mockTasks.filter(task => task.assigned_to.includes(userId));
      }
      
      const response = await apiClient.get(`/users/${userId}/tasks`);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch personal tasks');
    }
  }
);

// Team slice
const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    setActiveTeam(state, action: PayloadAction<Team | null>) {
      state.activeTeam = action.payload;
    },
    addTask(state, action: PayloadAction<Task>) {
      state.tasks.push(action.payload);
      if (action.payload.team_id === state.activeTeam?.id) {
        state.tasks = [...state.tasks];
      }
    },
    updateTask(state, action: PayloadAction<Task>) {
      const index = state.tasks.findIndex(task => task.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
        state.tasks = [...state.tasks];
      }
    },
    addReport(state, action: PayloadAction<Report>) {
      state.reports.push(action.payload);
      if (action.payload.team_id === state.activeTeam?.id) {
        state.reports = [...state.reports];
      }
    },
    resetTeamsState(state) {
      Object.assign(state, initialState);
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchTeams
      .addCase(fetchTeams.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.teams = action.payload;
        if (state.teams.length > 0 && !state.activeTeam) {
          state.activeTeam = state.teams[0];
        }
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      
      // Handle fetchTasks
      .addCase(fetchTasks.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      
      // Handle fetchReports
      .addCase(fetchReports.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.reports = action.payload;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      
      // Handle fetchPersonalTasks
      .addCase(fetchPersonalTasks.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPersonalTasks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.personalTasks = action.payload;
      })
      .addCase(fetchPersonalTasks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  }
});

// Mock data for development
const mockTeams: Team[] = [
  {
    id: '1',
    name: 'Frontend Development',
    description: 'Team responsible for UI/UX implementation',
    created_by: 'user123',
    created_at: '2023-12-01T12:00:00Z',
    members: [
      { id: 'user123', name: 'John Doe', email: 'john@example.com', role: 'Team Lead' },
      { id: 'user124', name: 'Jane Smith', email: 'jane@example.com', role: 'Developer' },
    ]
  },
  {
    id: '2',
    name: 'Backend Development',
    description: 'API and database implementation team',
    created_by: 'user125',
    created_at: '2023-12-05T12:00:00Z',
    members: [
      { id: 'user125', name: 'Mike Johnson', email: 'mike@example.com', role: 'Team Lead' },
      { id: 'user126', name: 'Sarah Williams', email: 'sarah@example.com', role: 'Developer' },
    ]
  }
];

const mockTasks: Task[] = [
  {
    id: 't1',
    title: 'Implement Chatbot Component',
    description: 'Create reusable chatbot component with proper state management',
    status: 'In Progress',
    priority: 'High',
    assigned_to: ['user123', 'user124'],
    due_date: '2024-03-28',
    team_id: '1',
    created_by: 'user123',
    created_at: '2024-03-20T09:00:00Z',
    updated_at: '2024-03-23T14:30:00Z'
  },
  {
    id: 't2',
    title: 'Design Teams Page',
    description: 'Create UI for teams page including stream, tasks and reports',
    status: 'To Do',
    priority: 'Medium',
    assigned_to: ['user124'],
    due_date: '2024-03-29',
    team_id: '1',
    created_by: 'user123',
    created_at: '2024-03-22T10:15:00Z',
    updated_at: '2024-03-22T10:15:00Z'
  },
  {
    id: 't3',
    title: 'Implement Authentication API',
    description: 'Create authentication endpoints for login and registration',
    status: 'Done',
    priority: 'High',
    assigned_to: ['user125', 'user126'],
    due_date: '2024-03-25',
    team_id: '2',
    created_by: 'user125',
    created_at: '2024-03-15T11:30:00Z',
    updated_at: '2024-03-24T08:45:00Z'
  }
];

const mockReports: Report[] = [
  {
    id: 'r1',
    created_by: 'user123',
    content: 'Weekly progress report: completed 3 tasks, 2 tasks in progress, blocked by design approval',
    team_id: '1',
    created_at: '2024-03-24T14:30:00Z'
  },
  {
    id: 'r2',
    created_by: 'user125',
    content: 'Backend deployment completed successfully. New APIs available for testing',
    team_id: '2',
    created_at: '2024-03-25T09:15:00Z'
  }
];

export const { setActiveTeam, addTask, updateTask, addReport, resetTeamsState } = teamsSlice.actions;
export default teamsSlice.reducer;