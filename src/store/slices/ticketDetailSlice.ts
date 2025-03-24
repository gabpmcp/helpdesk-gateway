import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Map as ImmutableMap, List as ImmutableList } from 'immutable';
import { 
  ZohoTicket, 
  ZohoComment, 
  ZohoCommentInput, 
  ImmutableTicket, 
  ImmutableComment 
} from '../../core/models/zoho.types';

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

// Async thunk that accepts a function parameter for fetching a ticket by ID
export const fetchTicketById = createAsyncThunk<
  ImmutableTicket,
  { fetchTicketById: (id: string) => Promise<ZohoTicket>; id: string },
  { rejectValue: string }
>(
  'ticketDetail/fetchTicketById',
  async ({ fetchTicketById, id }, { rejectWithValue }) => {
    try {
      const ticket = await fetchTicketById(id);
      // Usar Map de Immutable.js explícitamente
      return ImmutableMap(ticket) as unknown as ImmutableTicket;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch ticket');
    }
  }
);

// Async thunk that accepts a function parameter for adding a comment
export const addComment = createAsyncThunk<
  ImmutableComment,
  { 
    addComment: (ticketId: string, commentData: ZohoCommentInput) => Promise<ZohoComment>; 
    ticketId: string; 
    commentData: ZohoCommentInput 
  },
  { rejectValue: string }
>(
  'ticketDetail/addComment',
  async ({ addComment, ticketId, commentData }, { rejectWithValue }) => {
    try {
      const comment = await addComment(ticketId, commentData);
      // Usar Map de Immutable.js explícitamente
      return ImmutableMap(comment) as unknown as ImmutableComment;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add comment');
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
        // Usar casting explícito para evitar problemas de tipado
        state.ticket = action.payload as any;
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
          // Obtener los comentarios actuales o crear una lista vacía si no existen
          const ticketAny = state.ticket as any;
          const comments = ticketAny.get('comments', ImmutableList()) as unknown as ImmutableList<ImmutableComment>;
          state.ticket = ticketAny.set('comments', comments.push(action.payload)) as any;
        }
        state.commentLoading = false;
        state.error = null;
      })
      .addCase(addComment.rejected, (state, action) => {
        state.commentLoading = false;
        state.error = action.payload || 'Failed to add comment';
      });
  }
});

// Export actions and reducer
export const { resetTicketDetail } = ticketDetailSlice.actions;
export default ticketDetailSlice.reducer;
