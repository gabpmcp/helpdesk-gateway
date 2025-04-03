import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Map as ImmutableMap, fromJS } from 'immutable';
import type { Map as ImmutableMapType } from 'immutable';
import { 
  ZohoTicket, 
  ZohoTicketInput, 
  ImmutableTicket 
} from '../../core/models/zoho.types';
import { zohoService } from '../../services/zohoService';
import { RootState } from '../rootReducer';

// Interface for the state
export interface CreateTicketState {
  loading: boolean;
  error: string | null;
  ticket: ImmutableTicket | null;
}

// Initial state
const initialState: CreateTicketState = {
  loading: false,
  error: null,
  ticket: null
};

// Async thunk for creating a ticket
export const createTicket = createAsyncThunk<
  any, 
  { createTicketFn?: typeof zohoService.createTicket, ticketData: ZohoTicketInput },
  { rejectValue: string }
>(
  'tickets/createTicket',
  async ({ createTicketFn, ticketData }, { rejectWithValue }) => {
    try {
      // Use the provided function or fall back to the default
      const createTicketFunction = createTicketFn || zohoService.createTicket;
      
      // Create the ticket
      const response = await createTicketFunction(ticketData);
      
      // Ensure we return the complete response structure
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'An unknown error occurred');
    }
  }
);

// Create the slice
const createTicketSlice = createSlice({
  name: 'createTicket',
  initialState,
  reducers: {
    resetCreateTicket: () => initialState,
    clearCreateTicketError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.loading = false;
        // Transformar la respuesta a estructura inmutable manteniendo toda la estructura anidada
        state.ticket = fromJS(action.payload);
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'An unknown error occurred';
      });
  }
});

// Export actions and reducer
export const { resetCreateTicket, clearCreateTicketError } = createTicketSlice.actions;
export default createTicketSlice.reducer;

// Selectors
export const selectTicketLoading = (state: RootState) => 
  state.createTicket.loading;

export const selectTicketError = (state: RootState) => 
  state.createTicket.error;

export const selectCreatedTicket = (state: RootState) => 
  state.createTicket.ticket;
