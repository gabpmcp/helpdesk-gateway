import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Map as ImmutableMap, List as ImmutableList } from 'immutable';
import { 
  ZohoTicket, 
  ZohoComment, 
  ImmutableTicket, 
  ImmutableComment 
} from '../../core/models/zoho.types';
import { commandService, Command } from '../../core/api/helpdeskService';

// Define the state interface
interface TicketDetailState {
  ticket: ImmutableTicket | null;
  loading: boolean;
  commentLoading: boolean;
  error: string | null;
}

// Initial state with immutable structures
const initialState: TicketDetailState = {
  ticket: null,
  loading: false,
  commentLoading: false,
  error: null
};

// Interfaz para la respuesta del ticket
interface TicketResponse {
  ticket: ImmutableTicket;
}

// Interfaz para la respuesta del comentario
interface CommentResponse {
  commentAdded: boolean;
  commentId?: string;
}

// Async thunk for fetching a ticket by ID using the command service
export const fetchTicketById = createAsyncThunk<
  ImmutableTicket,
  { ticketId: string; userId: string; token: string },
  { rejectValue: string }
>(
  'ticketDetail/fetchTicketById',
  async ({ ticketId, userId, token }, { rejectWithValue }) => {
    try {
      // Crear comando para obtener detalles del ticket
      const command: Command = {
        type: 'FETCH_TICKET',
        userId,
        ticketId,
        timestamp: Date.now()
      };
      
      const result = await commandService.sendCommand<TicketResponse>(command, token);
      
      if (result.type === 'success') {
        return result.value.ticket;
      } else {
        return rejectWithValue(result.error.message);
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch ticket');
    }
  }
);

// Async thunk for adding a comment using the command service
export const addComment = createAsyncThunk<
  ImmutableComment,
  { 
    ticketId: string; 
    comment: string;
    userId: string;
    token: string;
  },
  { rejectValue: string }
>(
  'ticketDetail/addComment',
  async ({ ticketId, comment, userId, token }, { rejectWithValue }) => {
    try {
      // Crear comando para añadir comentario
      const command: Command = {
        type: 'ADD_COMMENT',
        userId,
        ticketId,
        comment,
        timestamp: Date.now()
      };
      
      const result = await commandService.sendCommand<CommentResponse>(command, token);
      
      if (result.type === 'success') {
        // Construir un objeto de comentario con los datos disponibles
        return ImmutableMap({
          id: result.value.commentId || `comment-${Date.now()}`,
          content: comment,
          createdTime: new Date().toISOString(),
          createdBy: {
            id: userId,
            name: 'Current User'
          }
        }) as unknown as ImmutableComment;
      } else {
        return rejectWithValue(result.error.message);
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add comment');
    }
  }
);

// Interfaz para la respuesta de escalación
interface EscalateResponse {
  escalated: boolean;
}

// Async thunk for escalating a ticket using the command service
export const escalateTicket = createAsyncThunk<
  { escalated: boolean },
  { 
    ticketId: string; 
    userId: string;
    token: string;
  },
  { rejectValue: string }
>(
  'ticketDetail/escalateTicket',
  async ({ ticketId, userId, token }, { rejectWithValue }) => {
    try {
      // Crear comando para escalar ticket
      const command: Command = {
        type: 'ESCALATE_TICKET',
        userId,
        ticketId,
        timestamp: Date.now()
      };
      
      const result = await commandService.sendCommand<EscalateResponse>(command, token);
      
      if (result.type === 'success') {
        return { escalated: true };
      } else {
        return rejectWithValue(result.error.message);
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to escalate ticket');
    }
  }
);

// Create the ticket detail slice
const ticketDetailSlice = createSlice({
  name: 'ticketDetail',
  initialState,
  reducers: {
    resetTicketDetail: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Fetch ticket cases
      .addCase(fetchTicketById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicketById.fulfilled, (state, action: PayloadAction<ImmutableTicket>) => {
        state.ticket = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchTicketById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch ticket';
      })
      
      // Add comment cases
      .addCase(addComment.pending, (state) => {
        state.commentLoading = true;
        state.error = null;
      })
      .addCase(addComment.fulfilled, (state, action: PayloadAction<ImmutableComment>) => {
        if (state.ticket) {
          const ticketAny = state.ticket as any;
          // Utilizar ImmutableList en lugar de List para evitar errores de tipo
          const comments = ticketAny.get('comments', ImmutableList<ImmutableComment>()) as ImmutableList<ImmutableComment>;
          state.ticket = ticketAny.set('comments', comments.push(action.payload)) as ImmutableTicket;
        }
        state.commentLoading = false;
        state.error = null;
      })
      .addCase(addComment.rejected, (state, action) => {
        state.commentLoading = false;
        state.error = action.payload || 'Failed to add comment';
      })
      
      // Escalate ticket cases
      .addCase(escalateTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(escalateTicket.fulfilled, (state) => {
        if (state.ticket) {
          const ticketAny = state.ticket as any;
          state.ticket = ticketAny.set('priority', 'High') as ImmutableTicket;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(escalateTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to escalate ticket';
      });
  }
});

// Export actions and reducer
export const { resetTicketDetail } = ticketDetailSlice.actions;
export default ticketDetailSlice.reducer;
