import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { List as ImmutableList, Map as ImmutableMap, fromJS } from 'immutable';
import { 
  ZohoTicket, 
  ZohoFilters, 
  ImmutableTicket, 
  ImmutableFilters, 
  ZohoComment,
  ZohoCommentInput,
  ImmutableComment 
} from '../../core/models/zoho.types';
import { zohoService } from '../../services/zohoService';

// Define the tickets response interface
interface TicketsResponse {
  tickets: ZohoTicket[];
  total: number;
  page: number;
  timestamp: string;
}

// Define the state interface
interface TicketsState {
  items: ImmutableList<ImmutableTicket>;
  filters: ImmutableFilters;
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
  // Añadir estructura para comentarios organizados por ticketId
  comments: ImmutableMap<string, ImmutableList<ImmutableComment>>;
  commentsLoading: boolean;
  commentsError: string | null;
}

// Initial state with immutable structures
const initialState: TicketsState = {
  items: ImmutableList(),
  filters: ImmutableMap(),
  total: 0,
  page: 1,
  loading: false,
  error: null,
  // Estado inicial para comentarios
  comments: ImmutableMap(),
  commentsLoading: false,
  commentsError: null
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
      
      // Convert to immutable structure
      const immutableTickets = ImmutableList(
        response.tickets.map(ticket => fromJS(ticket) as ImmutableTicket)
      );
      
      return {
        items: immutableTickets,
        total: response.total,
        page: response.page
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch tickets'
      );
    }
  }
);

// Async thunk para obtener comentarios de un ticket
export const fetchTicketComments = createAsyncThunk<
  { ticketId: string; comments: ImmutableList<ImmutableComment> },
  string, // ticketId
  { rejectValue: string }
>(
  'tickets/fetchTicketComments',
  async (ticketId, { rejectWithValue }) => {
    try {
      const comments = await zohoService.getTicketComments(ticketId);
      
      // Convertir a estructura inmutable
      const immutableComments = ImmutableList(
        comments.map(comment => fromJS(comment) as ImmutableComment)
      );
      
      return {
        ticketId,
        comments: immutableComments
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : `Failed to fetch comments for ticket ${ticketId}`
      );
    }
  }
);

// Async thunk para añadir un comentario a un ticket
export const addTicketComment = createAsyncThunk<
  { ticketId: string; comment: ImmutableComment },
  { ticketId: string; comment: ZohoCommentInput },
  { rejectValue: string }
>(
  'tickets/addTicketComment',
  async ({ ticketId, comment }, { rejectWithValue }) => {
    try {
      const response = await zohoService.addComment(ticketId, comment);
      
      // Convertir a estructura inmutable
      const immutableComment = fromJS(response) as ImmutableComment;
      
      return {
        ticketId,
        comment: immutableComment
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : `Failed to add comment to ticket ${ticketId}`
      );
    }
  }
);

// Create the slice
const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<ZohoFilters>) {
      state.filters = fromJS(action.payload) as ImmutableFilters;
    },
    resetTickets() {
      return initialState;
    },
    // Añadir acción para limpiar los errores de comentarios
    clearCommentsError(state) {
      state.commentsError = null;
    }
  },
  extraReducers: (builder) => {
    // Reducers para fetchTickets
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unknown error occurred';
      })
      // Reducers para fetchTicketComments
      .addCase(fetchTicketComments.pending, (state) => {
        state.commentsLoading = true;
        state.commentsError = null;
      })
      .addCase(fetchTicketComments.fulfilled, (state, action) => {
        state.commentsLoading = false;
        // Actualizar comentarios para el ticket específico
        state.comments = state.comments.set(
          action.payload.ticketId,
          action.payload.comments
        );
      })
      .addCase(fetchTicketComments.rejected, (state, action) => {
        state.commentsLoading = false;
        state.commentsError = action.payload ?? 'Failed to fetch comments';
      })
      // Reducers para addTicketComment
      .addCase(addTicketComment.pending, (state) => {
        state.commentsLoading = true;
        state.commentsError = null;
      })
      .addCase(addTicketComment.fulfilled, (state, action) => {
        state.commentsLoading = false;
        
        // Actualizar la lista de comentarios para el ticket
        const ticketId = action.payload.ticketId;
        const existingComments = state.comments.get(ticketId) || ImmutableList<ImmutableComment>();
        
        // Añadir el nuevo comentario a la lista existente
        state.comments = state.comments.set(
          ticketId,
          existingComments.push(action.payload.comment)
        );
      })
      .addCase(addTicketComment.rejected, (state, action) => {
        state.commentsLoading = false;
        state.commentsError = action.payload ?? 'Failed to add comment';
      });
  }
});

// Export actions and reducer
export const { setFilters, resetTickets, clearCommentsError } = ticketsSlice.actions;
export default ticketsSlice.reducer;

// Selectores funcionales
export const selectAllTickets = (state: { tickets: TicketsState }) => state.tickets.items;
export const selectTicketsLoading = (state: { tickets: TicketsState }) => state.tickets.loading;
export const selectTicketsError = (state: { tickets: TicketsState }) => state.tickets.error;
export const selectTicketsFilters = (state: { tickets: TicketsState }) => state.tickets.filters;
export const selectTicketsTotal = (state: { tickets: TicketsState }) => state.tickets.total;
export const selectTicketsPage = (state: { tickets: TicketsState }) => state.tickets.page;

// Selectores para comentarios
export const selectTicketComments = (state: { tickets: TicketsState }, ticketId: string) => 
  state.tickets.comments.get(ticketId) || ImmutableList<ImmutableComment>();

export const selectCommentsLoading = (state: { tickets: TicketsState }) => 
  state.tickets.commentsLoading;

export const selectCommentsError = (state: { tickets: TicketsState }) => 
  state.tickets.commentsError;

// Selector filtrado funcional (composición de funciones puras)
export const selectFilteredTickets = (state: { tickets: TicketsState }) => {
  const tickets = state.tickets.items;
  const filters = state.tickets.filters;
  
  return tickets.filter(ticket => {
    // Filtro por estatus
    const statusFilter = filters.get('status');
    if (statusFilter && ticket.get('status') !== statusFilter) {
      return false;
    }
    
    // Filtro por prioridad
    const priorityFilter = filters.get('priority');
    if (priorityFilter && ticket.get('priority') !== priorityFilter) {
      return false;
    }
    
    // Filtro por categoría/departamento
    const departmentFilter = filters.get('departmentId');
    if (departmentFilter && ticket.get('departmentId') !== departmentFilter) {
      return false;
    }
    
    return true;
  });
};
