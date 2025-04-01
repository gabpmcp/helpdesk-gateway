import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Map as ImmutableMap, fromJS } from 'immutable';
import { ZohoDashboardStats } from '../../core/models/zoho.types';
import { RootState } from '../index';
import { createSelector } from '@reduxjs/toolkit';
import { fetchDashboardData } from '../../services/dashboardProjectionService';

// Define the state interface
export interface DashboardState {
  stats: any; // Usamos 'any' para evitar problemas de tipado con Immutable.js
  loading: boolean;
  error: string | null;
}

// Initial state with immutable structures
const initialState: DashboardState = {
  stats: ImmutableMap({}),
  loading: false,
  error: null
};

// Async thunk for fetching unified dashboard stats from backend projection
export const fetchDashboard = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      // Usar el servicio de proyección para obtener los datos desde el backend
      // El backend será el que consulte n8n y éste a Zoho
      const stats = await fetchDashboardData();
      
      // Ya viene como estructura inmutable desde el servicio de proyección
      return stats;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch dashboard projections');
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
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.stats = action.payload;
        state.loading = false;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

// Export actions and reducer
export const { resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;

// Base selectors
export const selectDashboardStats = (state: RootState) => state.dashboard.stats;
export const selectDashboardLoading = (state: RootState) => state.dashboard.loading;
export const selectDashboardError = (state: RootState) => state.dashboard.error;

// Memoized derived selectors for specific metrics
export const selectTicketCount = createSelector(
  [selectDashboardStats],
  (stats) => stats ? stats.get('ticketCount', 0) : 0
);

export const selectOpenTicketCount = createSelector(
  [selectDashboardStats],
  (stats) => stats ? stats.get('openTicketCount', 0) : 0
);

export const selectUrgentTicketCount = createSelector(
  [selectDashboardStats],
  (stats) => stats ? stats.get('urgentTicketCount', 0) : 0
);

export const selectResponseTimeAvg = createSelector(
  [selectDashboardStats],
  (stats) => stats ? stats.get('responseTimeAvg', 0) : 0
);

export const selectSatisfactionScore = createSelector(
  [selectDashboardStats],
  (stats) => stats ? stats.get('satisfactionScore', 0) : 0
);

// Selectors for ticket distribution metrics
export const selectTicketsByPriority = createSelector(
  [selectDashboardStats],
  (stats) => stats && stats.getIn(['metrics', 'ticketsByPriority']) 
    ? stats.getIn(['metrics', 'ticketsByPriority']) 
    : ImmutableMap({})
);

export const selectTicketsByStatus = createSelector(
  [selectDashboardStats],
  (stats) => stats && stats.getIn(['metrics', 'ticketsByStatus']) 
    ? stats.getIn(['metrics', 'ticketsByStatus']) 
    : ImmutableMap({})
);

// Format selector for chart data
export const selectTicketsByPriorityChartData = createSelector(
  [selectTicketsByPriority],
  (distribution) => {
    if (!distribution) return [];
    
    return [
      { name: 'Low', value: distribution.get('Low', 0) },
      { name: 'Medium', value: distribution.get('Medium', 0) },
      { name: 'High', value: distribution.get('High', 0) },
      { name: 'Urgent', value: distribution.get('Urgent', 0) }
    ];
  }
);

export const selectTicketsByStatusChartData = createSelector(
  [selectTicketsByStatus],
  (distribution) => {
    if (!distribution) return [];
    
    return [
      { name: 'Open', value: distribution.get('Open', 0) },
      { name: 'In Progress', value: distribution.get('In Progress', 0) },
      { name: 'Closed', value: distribution.get('Closed', 0) },
      { name: 'On Hold', value: distribution.get('On Hold', 0) }
    ];
  }
);

// Exportamos aliases para mantener compatibilidad con nombres anteriores
export const selectTicketsByPriorityData = selectTicketsByPriorityChartData;
export const selectTicketsByStatusData = selectTicketsByStatusChartData;
