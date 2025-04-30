import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fromJS, Map as ImmutableMap } from 'immutable';
import { zohoService } from '../../services/zohoService';
import { fetchDashboardOverview } from '../../services/dashboardProjectionService';

// Define state interfaces with immutable structures
export interface ZohoReportsState {
  data: any | null;
  loading: boolean;
  error: string | null;
}

// Initial state with immutable structures
const initialState: ZohoReportsState = {
  data: null,
  loading: false,
  error: null
};

// Async thunk for fetching reports overview using zohoService
export const fetchReportsOverview = createAsyncThunk(
  'zoho/fetchReportsOverview',
  async (_, { rejectWithValue }) => {
    try {
      // Call the service function to fetch data
      const data = await zohoService.getDashboardStats();
      
      // Return the data for the fulfilled action
      return data;
    } catch (error) {
      // Return error for the rejected action
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch reports overview'
      );
    }
  }
);

// Async thunk for fetching reports overview using the new webhook endpoint
export const fetchReportsWebhook = createAsyncThunk(
  'zoho/fetchReportsWebhook',
  async (_, { rejectWithValue }) => {
    try {
      // Call the projection service to fetch data from webhook
      const data = await fetchDashboardOverview();
      
      // Return the data for the fulfilled action
      return data.toJS();
    } catch (error) {
      // Return error for the rejected action
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch reports from webhook'
      );
    }
  }
);

// Async thunk for creating a new ticket
export const createTicket = createAsyncThunk(
  'zoho/createTicket',
  async (ticketData: any, { rejectWithValue }) => {
    try {
      // Call the service function to create ticket
      const response = await zohoService.createTicket(ticketData);
      
      // Return the ticket data for the fulfilled action
      return response;
    } catch (error) {
      // Return error for the rejected action
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to create ticket'
      );
    }
  }
);

// Create the Zoho slice with reducers for each action
const zohoSlice = createSlice({
  name: 'zoho',
  initialState,
  reducers: {
    // Action to reset the state
    resetZohoReports: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
    
    // Action to clear error
    clearZohoError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle pending state
      .addCase(fetchReportsOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Handle successful fetch
      .addCase(fetchReportsOverview.fulfilled, (state, action) => {
        // Convert the payload to an Immutable.js Map
        state.data = fromJS(action.payload);
        state.loading = false;
      })
      // Handle fetch error
      .addCase(fetchReportsOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'An error occurred';
      })
      // Handle webhook pending state
      .addCase(fetchReportsWebhook.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Handle webhook successful fetch
      .addCase(fetchReportsWebhook.fulfilled, (state, action) => {
        // Convert the payload to an Immutable.js Map
        state.data = fromJS(action.payload);
        state.loading = false;
      })
      // Handle webhook fetch error
      .addCase(fetchReportsWebhook.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'An error occurred';
      })
      // Handle create ticket pending state
      .addCase(createTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Handle create ticket successful
      .addCase(createTicket.fulfilled, (state, action) => {
        // Convert the payload to an Immutable.js Map
        state.data = fromJS(action.payload);
        state.loading = false;
      })
      // Handle create ticket error
      .addCase(createTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'An error occurred';
      });
  }
});

// Export actions and reducer
export const { resetZohoReports, clearZohoError } = zohoSlice.actions;
export default zohoSlice.reducer;

// Selectors for accessing state in components
export const selectZohoReportsData = (state: { zoho: ZohoReportsState }) => state.zoho.data;
export const selectZohoReportsLoading = (state: { zoho: ZohoReportsState }) => state.zoho.loading;
export const selectZohoReportsError = (state: { zoho: ZohoReportsState }) => state.zoho.error;

// Derived selectors for chart data
export const selectTicketsByPriorityData = (state: { zoho: ZohoReportsState }) => {
  const data = state.zoho.data;
  if (!data) return null;
  
  const priorities = data.getIn(['metrics', 'ticketsByPriority'], ImmutableMap());
  
  return priorities.entrySeq().map(([key, value]) => ({
    name: key,
    value: typeof value === 'number' ? value : 0
  })).toJS();
};

export const selectTicketsByStatusData = (state: { zoho: ZohoReportsState }) => {
  const data = state.zoho.data;
  if (!data) return null;
  
  const statuses = data.getIn(['metrics', 'ticketsByStatus'], ImmutableMap());
  
  return statuses.entrySeq().map(([key, value]) => ({
    name: key,
    value: typeof value === 'number' ? value : 0
  })).toJS();
};

// Derived selectors for specific data - sin fallback para propagar los errores correctamente
export const selectTicketsByPriority = (state: { zoho: ZohoReportsState }, priority: string) => {
  const data = state.zoho.data;
  if (!data) throw new Error('No hay datos disponibles de tickets por prioridad');
  
  // Obtener directamente de la estructura de métricas, sin fallbacks
  const value = data.getIn(['metrics', 'ticketsByPriority', priority]);
  if (value === undefined) {
    throw new Error(`No se encontraron datos para la prioridad: ${priority}`);
  }
  
  return value;
};

export const selectTicketsByStatus = (state: { zoho: ZohoReportsState }, status: string) => {
  const data = state.zoho.data;
  if (!data) throw new Error('No hay datos disponibles de tickets por estado');
  
  // Obtener directamente de la estructura de métricas, sin fallbacks
  const value = data.getIn(['metrics', 'ticketsByStatus', status]);
  if (value === undefined) {
    throw new Error(`No se encontraron datos para el estado: ${status}`);
  }
  
  return value;
};

export const selectTicketCount = (state: { zoho: ZohoReportsState }) => {
  const data = state.zoho.data;
  if (!data) throw new Error('No hay datos disponibles de conteo de tickets');
  
  const count = data.get('ticketCount');
  if (count === undefined) {
    throw new Error('No se encontró el contador de tickets en los datos');
  }
  
  return count;
};

export const selectOpenTicketCount = (state: { zoho: ZohoReportsState }) => {
  const data = state.zoho.data;
  if (!data) throw new Error('No hay datos disponibles de tickets abiertos');
  
  const count = data.get('openTicketCount');
  if (count === undefined) {
    throw new Error('No se encontró el contador de tickets abiertos en los datos');
  }
  
  return count;
};

export const selectUrgentTicketCount = (state: { zoho: ZohoReportsState }) => {
  const data = state.zoho.data;
  if (!data) throw new Error('No hay datos disponibles de tickets urgentes');
  
  const count = data.get('urgentTicketCount');
  if (count === undefined) {
    throw new Error('No se encontró el contador de tickets urgentes en los datos');
  }
  
  return count;
};

export const selectResponseTimeAvg = (state: { zoho: ZohoReportsState }) => {
  const data = state.zoho.data;
  if (!data) throw new Error('No hay datos disponibles de tiempo de respuesta');
  
  const avg = data.get('responseTimeAvg');
  if (avg === undefined) {
    throw new Error('No se encontró el tiempo promedio de respuesta en los datos');
  }
  
  return avg;
};

export const selectSatisfactionScore = (state: { zoho: ZohoReportsState }) => {
  const data = state.zoho.data;
  if (!data) throw new Error('No hay datos disponibles de satisfacción');
  
  const score = data.get('satisfactionScore');
  if (score === undefined) {
    throw new Error('No se encontró la puntuación de satisfacción en los datos');
  }
  
  return score;
};
