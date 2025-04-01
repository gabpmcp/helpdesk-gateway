/**
 * Dashboard Projection Slice
 * 
 * Redux slice for dashboard projections following FCIS principles
 * (Functional, Composable, Isolated, Stateless)
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Map as ImmutableMap, List, fromJS, isMap } from 'immutable';
import { 
  fetchDashboardData,
  fetchDashboardOverview,
  fetchDashboardTickets
} from '../../services/dashboardProjectionService';
import { ImmutableTicket } from '../../core/models/zoho.types';

// Define the state interface using plain JavaScript objects
export interface DashboardProjectionState {
  data: Record<string, any>; // Usando Record en lugar de Map
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// Initial state con objeto vacío
const initialState: DashboardProjectionState = {
  data: {}, // Objeto vacío en lugar de Map
  loading: false,
  error: null,
  lastUpdated: null
};

/**
 * Convierte un ImmutableMap a un objeto JavaScript plano
 * Esta función maneja estructuras anidadas y arrays
 */
function immutableToJS(immutable: any): any {
  // Si no es un valor de Immutable, retornar tal cual
  if (!immutable || typeof immutable !== 'object' || !('toJS' in immutable)) {
    return immutable;
  }
  
  // Usar toJS para convertir a JavaScript plano
  return immutable.toJS();
}

// Async thunk for fetching dashboard data
export const fetchDashboardProjection = createAsyncThunk<any, void>(
  'dashboardProjection/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchDashboardData();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }
);

// Async thunk for fetching dashboard overview
export const fetchDashboardOverviewProjection = createAsyncThunk<any, void>(
  'dashboardProjection/fetchOverview',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchDashboardOverview();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }
);

// Async thunk for fetching dashboard tickets
export const fetchDashboardTicketsProjection = createAsyncThunk<any, void>(
  'dashboardProjection/fetchTickets',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchDashboardTickets();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }
);

// Create the dashboard projection slice
const dashboardProjectionSlice = createSlice({
  name: 'dashboardProjection',
  initialState,
  reducers: {
    // Reset dashboard state
    resetDashboard: () => initialState,
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Handle fetchDashboardProjection
    builder
      .addCase(fetchDashboardProjection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardProjection.fulfilled, (state, action) => {
        // Convertir el payload a un objeto JavaScript plano
        const jsPayload = isMap(action.payload) || List.isList(action.payload)
          ? immutableToJS(action.payload)
          : action.payload || {};
        
        // Asignar al state (Immer se encargará de la inmutabilidad)
        state.data = jsPayload;
        state.loading = false;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchDashboardProjection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch dashboard data';
      })
      
      // Handle fetchDashboardOverviewProjection
      .addCase(fetchDashboardOverviewProjection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardOverviewProjection.fulfilled, (state, action) => {
        // Asegurar que trabajamos con un ImmutableMap
        const immutablePayload = isMap(action.payload)
          ? action.payload
          : fromJS(action.payload || {});
        
        // Extraer valores
        const metrics = immutablePayload.get('metrics', ImmutableMap());
        const ticketCount = immutablePayload.get('ticketCount', 0);
        const openTicketCount = immutablePayload.get('openTicketCount', 0);
        const urgentTicketCount = immutablePayload.get('urgentTicketCount', 0);
        const responseTimeAvg = immutablePayload.get('responseTimeAvg', 0);
        const satisfactionScore = immutablePayload.get('satisfactionScore', 0);
        const lastUpdated = immutablePayload.get('lastUpdated', new Date().toISOString());
        
        // Crear objeto JavaScript con los valores
        const jsData = {
          metrics: immutableToJS(metrics),
          ticketCount,
          openTicketCount,
          urgentTicketCount,
          responseTimeAvg,
          satisfactionScore,
          lastUpdated
        };
        
        // Actualizar state.data (Immer se encargará de la inmutabilidad)
        state.data = {
          ...state.data,
          ...jsData
        };
        
        state.loading = false;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchDashboardOverviewProjection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch dashboard overview';
      })
      
      // Handle fetchDashboardTicketsProjection
      .addCase(fetchDashboardTicketsProjection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardTicketsProjection.fulfilled, (state, action) => {
        // Asegurar que trabajamos con un ImmutableMap
        const immutablePayload = isMap(action.payload)
          ? action.payload
          : fromJS(action.payload || {});
        
        // Obtener tickets del payload
        const tickets = immutablePayload.get('tickets', List());
        
        // Actualizar state.data (Immer se encargará de la inmutabilidad)
        state.data = {
          ...state.data,
          tickets: immutableToJS(tickets)
        };
        
        state.loading = false;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchDashboardTicketsProjection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch dashboard tickets';
      });
  }
});

// Export actions
export const { resetDashboard, clearError } = dashboardProjectionSlice.actions;

/**
 * Convierte un objeto JavaScript a un ImmutableMap
 * Para uso interno en selectores
 */
const jsToImmutable = (jsObject: Record<string, any>): ImmutableMap<string, any> => {
  return fromJS(jsObject) as ImmutableMap<string, any>;
};

// Export selectors
export const selectDashboardData = (state: { dashboardProjection: DashboardProjectionState }) => 
  jsToImmutable(state.dashboardProjection.data);

export const selectDashboardLoading = (state: { dashboardProjection: DashboardProjectionState }) => 
  state.dashboardProjection.loading;

export const selectDashboardError = (state: { dashboardProjection: DashboardProjectionState }) => 
  state.dashboardProjection.error;

export const selectDashboardLastUpdated = (state: { dashboardProjection: DashboardProjectionState }) => 
  state.dashboardProjection.lastUpdated;

export const selectDashboardMetrics = (state: { dashboardProjection: DashboardProjectionState }) => {
  const metrics = state.dashboardProjection.data.metrics || {};
  return jsToImmutable(metrics);
};

export const selectDashboardTickets = (state: { dashboardProjection: DashboardProjectionState }) => {
  const tickets = state.dashboardProjection.data.tickets || [];
  return List(tickets);
};

export const selectTicketCount = (state: { dashboardProjection: DashboardProjectionState }) => 
  state.dashboardProjection.data.ticketCount || 0;

export const selectOpenTicketCount = (state: { dashboardProjection: DashboardProjectionState }) => 
  state.dashboardProjection.data.openTicketCount || 0;

export const selectUrgentTicketCount = (state: { dashboardProjection: DashboardProjectionState }) => 
  state.dashboardProjection.data.urgentTicketCount || 0;

export const selectResponseTimeAvg = (state: { dashboardProjection: DashboardProjectionState }) => 
  state.dashboardProjection.data.responseTimeAvg || 0;

export const selectSatisfactionScore = (state: { dashboardProjection: DashboardProjectionState }) => 
  state.dashboardProjection.data.satisfactionScore || 0;

// Export reducer
export default dashboardProjectionSlice.reducer;
