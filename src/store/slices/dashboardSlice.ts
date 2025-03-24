import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Map as ImmutableMap } from 'immutable';
import { ZohoDashboardStats, ImmutableDashboardStats } from '../../core/models/zoho.types';

// Define the state interface
export interface DashboardState {
  stats: ImmutableDashboardStats | null;
  loading: boolean;
  error: string | null;
}

// Initial state with immutable structures
const initialState: DashboardState = {
  stats: ImmutableMap<string, any>(),
  loading: false,
  error: null
};

// Async thunk that accepts a function parameter for fetching dashboard stats
export const fetchDashboardStats = createAsyncThunk<
  ImmutableDashboardStats,
  () => Promise<ZohoDashboardStats>,
  { rejectValue: string }
>(
  'dashboard/fetchStats',
  async (fetchStats, { rejectWithValue }) => {
    try {
      const stats = await fetchStats();
      return ImmutableMap(stats) as ImmutableDashboardStats;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch dashboard stats');
    }
  }
);

// Create the dashboard slice
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    resetDashboard: () => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action: PayloadAction<ImmutableDashboardStats>) => {
        state.stats = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch dashboard stats';
      });
  }
});

// Export actions and reducer
export const { resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
