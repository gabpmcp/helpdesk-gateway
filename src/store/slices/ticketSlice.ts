/**
 * Ticket Slice - Redux State Management
 * 
 * Maneja el estado de los tickets y la comunicación con el backend
 * siguiendo patrones funcionales e inmutables
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { List, Map as ImmutableMap } from 'immutable';
import { getRuntimeConfig } from '../../config';

// Definición del tipo RootState aquí para evitar referencias circulares
export interface RootState {
  tickets: TicketState;
  // Otros estados si los hubiera
}

// Tipos de datos
export type ImmutableComment = ImmutableMap<string, any>;

// Tipos inmutables para tickets
type ImmutableTicket = ImmutableMap<string, any>;
type ImmutableTicketList = List<ImmutableTicket>;

// Estado inicial
interface TicketState {
  tickets: ImmutableTicketList;
  selectedTicket: ImmutableMap<string, any>;
  loading: boolean;
  error: string | null;
}

const initialState: TicketState = {
  tickets: List<ImmutableTicket>(),
  selectedTicket: ImmutableMap<string, any>(),
  loading: false,
  error: null,
};

// Helper para obtener la base URL de la API en tiempo de ejecución
function getApiBaseUrl() {
  return getRuntimeConfig().api.baseUrl;
}

// Thunks asíncronos
export const fetchTickets = createAsyncThunk(
  'tickets/fetchTickets',
  async (filters: Record<string, any> = {}, { rejectWithValue }) => {
    try {
      // Construir querystring a partir de los filtros
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const queryString = queryParams.toString();
      const url = `/api/tickets${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(`${getApiBaseUrl()}${url}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching tickets: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al obtener tickets');
    }
  }
);

export const fetchTicketById = createAsyncThunk(
  'tickets/fetchTicketById',
  async (ticketId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/tickets/${ticketId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching ticket details: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al obtener detalles del ticket');
    }
  }
);

export const createTicket = createAsyncThunk(
  'tickets/createTicket',
  async (ticketData: Record<string, any>, { rejectWithValue }) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/tickets`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify(ticketData)
      });
      
      if (!response.ok) {
        throw new Error(`Error creating ticket: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al crear ticket');
    }
  }
);

export const updateTicketStatus = createAsyncThunk(
  'tickets/updateTicketStatus',
  async (
    { ticketId, status }: { ticketId: string; status: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/tickets/${ticketId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error(`Error updating ticket status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al actualizar estado del ticket');
    }
  }
);

export const addTicketComment = createAsyncThunk(
  'tickets/addTicketComment',
  async (
    { 
      ticketId, 
      message, 
      attachments = [] 
    }: { 
      ticketId: string; 
      message: string; 
      attachments?: File[] 
    },
    { rejectWithValue }
  ) => {
    try {
      let response;
      
      if (attachments.length > 0) {
        const formData = new FormData();
        formData.append('message', message);
        
        attachments.forEach((file, index) => {
          formData.append(`attachments`, file);
        });
        
        response = await fetch(
          `${getApiBaseUrl()}/api/tickets/${ticketId}/comments`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
            },
            mode: 'cors',
            body: formData
          }
        );
      } else {
        response = await fetch(`${getApiBaseUrl()}/api/tickets/${ticketId}/comments`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          mode: 'cors',
          body: JSON.stringify({ message })
        });
      }
      
      if (!response.ok) {
        throw new Error(`Error adding comment: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al añadir comentario');
    }
  }
);

// Slice
const ticketSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    clearSelectedTicket: (state) => {
      state.selectedTicket = ImmutableMap<string, any>();
    },
    clearTicketError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tickets
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action: PayloadAction<any>) => {
        state.tickets = List(
          (action.payload?.tickets || []).map((ticket: any) => ImmutableMap<string, any>(ticket)) as any[]
        );
        state.loading = false;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Error desconocido';
      })
      
      // Fetch ticket by ID
      .addCase(fetchTicketById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicketById.fulfilled, (state, action: PayloadAction<any>) => {
        state.selectedTicket = ImmutableMap<string, any>(action.payload || {});
        state.loading = false;
      })
      .addCase(fetchTicketById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Error al cargar detalles del ticket';
      })
      
      // Create ticket
      .addCase(createTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTicket.fulfilled, (state, action: PayloadAction<any>) => {
        // Añadir el nuevo ticket a la lista de tickets
        const newTicket = ImmutableMap<string, any>(action.payload || {}) as ImmutableTicket;
        state.tickets = state.tickets.unshift(newTicket);
        state.selectedTicket = newTicket;
        state.loading = false;
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Error al crear ticket';
      })
      
      // Update ticket status
      .addCase(updateTicketStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTicketStatus.fulfilled, (state, action: PayloadAction<any>) => {
        // Actualizar el ticket seleccionado
        state.selectedTicket = ImmutableMap<string, any>(action.payload || {});
        
        // Actualizar el ticket en la lista si existe
        const ticketId = state.selectedTicket.get('id');
        if (ticketId) {
          const index = state.tickets.findIndex(
            (ticket: ImmutableTicket) => ticket.get('id') === ticketId
          );
          
          if (index !== -1) {
            state.tickets = state.tickets.set(
              index, 
              state.selectedTicket as ImmutableTicket
            );
          }
        }
        
        state.loading = false;
      })
      .addCase(updateTicketStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Error al actualizar estado';
      })
      
      // Add comment
      .addCase(addTicketComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTicketComment.fulfilled, (state, action: PayloadAction<any>) => {
        // Actualizar el ticket seleccionado con el nuevo comentario
        state.selectedTicket = ImmutableMap<string, any>(action.payload || {}) as ImmutableTicket;
        
        // Actualizar el ticket en la lista si existe
        const ticketId = state.selectedTicket.get('id');
        if (ticketId) {
          const index = state.tickets.findIndex(
            (ticket: ImmutableTicket) => ticket.get('id') === ticketId
          );
          
          if (index !== -1) {
            state.tickets = state.tickets.set(
              index,
              state.selectedTicket as ImmutableTicket
            );
          }
        }
        
        state.loading = false;
      })
      .addCase(addTicketComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Error al añadir comentario';
      });
  },
});

// Acciones
export const { clearSelectedTicket, clearTicketError } = ticketSlice.actions;

// Selectores
export const selectAllTickets = (state: RootState) => state.tickets.tickets;
export const selectMyTickets = (state: RootState) => 
  state.tickets.tickets.filter(
    (ticket: ImmutableTicket) => ticket.get('isOwnedByCurrentUser', false)
  );
export const selectOpenTickets = (state: RootState) => 
  state.tickets.tickets.filter(
    (ticket: ImmutableTicket) => ticket.get('status') === 'Open' || ticket.get('status') === 'In Progress'
  );
export const selectTicketHistory = (state: RootState) => 
  state.tickets.tickets.filter(
    (ticket: ImmutableTicket) => ticket.get('status') === 'Closed'
  );
export const selectSelectedTicket = (state: RootState) => state.tickets.selectedTicket;
export const selectTicketLoading = (state: RootState) => state.tickets.loading;
export const selectTicketError = (state: RootState) => state.tickets.error;
export const selectTicketMessages = (state: RootState) => 
  state.tickets.selectedTicket.get('messages', List());

// Exportar reducer
export default ticketSlice.reducer;
