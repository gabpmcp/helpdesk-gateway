import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { List as ImmutableList, Map as ImmutableMap } from 'immutable';
import { ZohoTicket, ZohoFilters, ImmutableTicket, ImmutableFilters } from '../../core/models/zoho.types';

// Define the tickets response interface
interface TicketsResponse {
  tickets: ZohoTicket[];
  total: number;
  page: number;
}

// Define the state interface
interface TicketsState {
  items: ImmutableList<ImmutableTicket>;
  filters: ImmutableFilters;
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
}

// Initial state with immutable structures
const initialState: TicketsState = {
  items: ImmutableList(),
  filters: ImmutableMap(),
  total: 0,
  page: 1,
  loading: false,
  error: null
};

// Async thunk that accepts a function parameter for fetching tickets
export const fetchTickets = createAsyncThunk<
  { items: ImmutableList<ImmutableTicket>; total: number; page: number },
  { fetchTickets: (filters: ZohoFilters) => Promise<TicketsResponse>; filters: ZohoFilters },
  { rejectValue: string }
>(
  'tickets/fetchTickets',
  async ({ fetchTickets, filters }, { rejectWithValue }) => {
    try {
      const response = await fetchTickets(filters);
      return {
        items: ImmutableList(response.tickets.map(ticket => ImmutableMap(ticket) as ImmutableTicket)),
        total: response.total,
        page: response.page
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch tickets');
    }
  }
);

// Create the tickets slice
const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<ZohoFilters>) => {
      state.filters = ImmutableMap(action.payload) as ImmutableFilters;
    },
    resetTickets: () => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch tickets';
      });
  }
});

// Export actions and reducer
export const { setFilters, resetTickets } = ticketsSlice.actions;
export default ticketsSlice.reducer;
