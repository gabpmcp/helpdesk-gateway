import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fromJS, Map as ImmutableMap } from 'immutable';
import { zohoService } from '../../services/zohoService';
import { fetchReportsOverview as fetchReportsOverviewService } from '../../services/dashboardProjectionService';

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
      const data = await fetchReportsOverviewService();
      
      // Return the data for the fulfilled action
      return data.toJS();
    } catch (error) {
      // Return error for the rejected action
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch reports webhook data'
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

// Derived selectors for specific data
export const selectTicketsByPriority = (state: { zoho: ZohoReportsState }, priority: string) => {
  const data = state.zoho.data;
  if (!data) return 0;
  
  // Try to get from the new metrics structure
  const fromMetrics = data.getIn(['metrics', 'ticketsByPriority', priority], 0);
  if (fromMetrics) return fromMetrics;
  
  // Fallback to older data structure if available
  return data.get(`${priority.toLowerCase()}PriorityTicketsCount`, 0);
};

export const selectTicketsByStatus = (state: { zoho: ZohoReportsState }, status: string) => {
  const data = state.zoho.data;
  if (!data) return 0;
  
  // Try to get from the new metrics structure
  const fromMetrics = data.getIn(['metrics', 'ticketsByStatus', status], 0);
  if (fromMetrics) return fromMetrics;
  
  // Fallback to older data structure if available
  return data.get(`${status.toLowerCase()}TicketsCount`, 0);
};

export const selectTicketCount = (state: { zoho: ZohoReportsState }) => {
  const data = state.zoho.data;
  if (!data) return 0;
  
  return data.get('ticketCount', 0);
};

export const selectOpenTicketCount = (state: { zoho: ZohoReportsState }) => {
  const data = state.zoho.data;
  if (!data) return 0;
  
  return data.get('openTicketCount', 0);
};

export const selectUrgentTicketCount = (state: { zoho: ZohoReportsState }) => {
  const data = state.zoho.data;
  if (!data) return 0;
  
  return data.get('urgentTicketCount', 0);
};

export const selectResponseTimeAvg = (state: { zoho: ZohoReportsState }) => {
  const data = state.zoho.data;
  if (!data) return 0;
  
  return data.get('responseTimeAvg', 0);
};

export const selectSatisfactionScore = (state: { zoho: ZohoReportsState }) => {
  const data = state.zoho.data;
  if (!data) return 0;
  
  return data.get('satisfactionScore', 0);
};
