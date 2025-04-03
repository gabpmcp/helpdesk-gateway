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
      .addCase(fetchDashboard.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        // Ahora hay que asegurarse de que los datos están en el formato correcto
        // ya sea en formato Immutable o JSON plano
        
        console.log("[Dashboard Slice] Data received:", action.payload);
        
        let dashboardData;
        
        // Si ya es un Map inmutable, usarlo directamente
        if (ImmutableMap.isMap(action.payload)) {
          dashboardData = action.payload;
          console.log("[Dashboard Slice] Using immutable data");
        } 
        // Si es un objeto plano JSON, convertirlo a inmutable
        else if (typeof action.payload === 'object' && action.payload !== null) {
          dashboardData = fromJS(action.payload);
          console.log("[Dashboard Slice] Converted plain object to immutable");
        }
        // Si no, crear un Map vacío
        else {
          console.warn("[Dashboard Slice] Invalid data format received");
          dashboardData = ImmutableMap({});
        }
        
        // Actualizando el estado con los datos adaptados para dashboard
        state.stats = dashboardData;
        state.error = null;
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
    
    // Verificar si estamos manejando un Map inmutable o un objeto JavaScript normal
    const isImmutable = ImmutableMap.isMap(distribution);
    
    console.log('[Dashboard Selector] Tipo de datos para prioridad:', 
                isImmutable ? 'Immutable Map' : 'JavaScript Object', 
                distribution);
    
    // Acceder a los datos según el tipo
    return [
      { 
        name: 'Low', 
        value: isImmutable 
          ? distribution.get('Low', 0) 
          : (distribution.Low || 0) 
      },
      { 
        name: 'Medium', 
        value: isImmutable 
          ? distribution.get('Medium', 0) 
          : (distribution.Medium || 0) 
      },
      { 
        name: 'High', 
        value: isImmutable 
          ? distribution.get('High', 0) 
          : (distribution.High || 0) 
      },
      { 
        name: 'Urgent', 
        value: isImmutable 
          ? distribution.get('Urgent', 0) 
          : (distribution.Urgent || 0) 
      }
    ];
  }
);

export const selectTicketsByStatusChartData = createSelector(
  [selectTicketsByStatus],
  (distribution) => {
    if (!distribution) return [];
    
    // Verificar si estamos manejando un Map inmutable o un objeto JavaScript normal
    const isImmutable = ImmutableMap.isMap(distribution);
    
    console.log('[Dashboard Selector] Tipo de datos para estado:', 
                isImmutable ? 'Immutable Map' : 'JavaScript Object', 
                distribution);
    
    // Acceder a los datos según el tipo
    return [
      { 
        name: 'Open', 
        value: isImmutable 
          ? distribution.get('Open', 0) 
          : (distribution.Open || 0) 
      },
      { 
        name: 'In Progress', 
        value: isImmutable 
          ? distribution.get('In Progress', 0) 
          : (distribution['In Progress'] || 0) 
      },
      { 
        name: 'Closed', 
        value: isImmutable 
          ? distribution.get('Closed', 0) 
          : (distribution.Closed || 0) 
      },
      { 
        name: 'On Hold', 
        value: isImmutable 
          ? distribution.get('On Hold', 0) 
          : (distribution['On Hold'] || 0) 
      }
    ];
  }
);

// Exportamos aliases para mantener compatibilidad con nombres anteriores
export const selectTicketsByPriorityData = selectTicketsByPriorityChartData;
export const selectTicketsByStatusData = selectTicketsByStatusChartData;
