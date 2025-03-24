import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Map, List, fromJS } from 'immutable';
import { 
  ImmutableTicket, 
  ImmutableDashboardStats, 
  ImmutableCategory,
  ZohoTicket,
  ZohoDashboardStats,
  ZohoCategory,
  ZohoFilters
} from '../../core/models/zoho.types';

// Define el tipo del estado de la aplicación
export type AppState = Map<string, any>;

// Estado inicial usando estructuras inmutables
const initialState = Map({
  // Dashboard
  dashboardStats: Map({
    data: null,
    loading: false,
    error: null
  }),
  
  // Tickets
  tickets: Map({
    data: List(),
    total: 0,
    page: 1,
    loading: false,
    error: null,
    filters: Map({
      status: '',
      priority: '',
      category: '',
      search: '',
      page: 1,
      limit: 10
    })
  }),
  
  // Ticket Detail
  ticketDetail: Map({
    data: null,
    loading: false,
    error: null,
    commentLoading: false,
    commentError: null
  }),
  
  // Categories
  categories: Map({
    data: List(),
    loading: false,
    error: null
  })
});

// Funciones auxiliares para trabajar con el estado inmutable
const setLoading = (state: AppState, path: string[], loading: boolean): AppState => {
  return state.setIn([...path, 'loading'], loading);
};

const setError = (state: AppState, path: string[], error: string | null): AppState => {
  return state.setIn([...path, 'error'], error);
};

const setData = (state: AppState, path: string[], data: any): AppState => {
  return state.setIn([...path, 'data'], data);
};

// Slice con reducers puros e inmutables
const appSlice = createSlice({
  name: 'app',
  initialState: initialState as any,
  reducers: {
    // Dashboard actions
    fetchDashboardStatsStart: (state: AppState) => {
      return setError(setLoading(state, ['dashboardStats'], true), ['dashboardStats'], null);
    },
        
    fetchDashboardStatsSuccess: (state: AppState, action: PayloadAction<ImmutableDashboardStats>) => {
      return setLoading(setData(state, ['dashboardStats'], action.payload), ['dashboardStats'], false);
    },
        
    fetchDashboardStatsFailure: (state: AppState, action: PayloadAction<string>) => {
      return setError(setLoading(state, ['dashboardStats'], false), ['dashboardStats'], action.payload);
    },
    
    // Tickets actions
    setTicketsFilters: (state: AppState, action: PayloadAction<Map<string, any>>) => {
      return state.setIn(['tickets', 'filters'], action.payload);
    },
      
    fetchTicketsStart: (state: AppState) => {
      return setError(setLoading(state, ['tickets'], true), ['tickets'], null);
    },
        
    fetchTicketsSuccess: (state: AppState, action: PayloadAction<{tickets: List<ImmutableTicket>, total: number, page: number}>) => {
      const { tickets, total, page } = action.payload;
      let newState = setData(state, ['tickets'], tickets);
      newState = newState.setIn(['tickets', 'total'], total);
      newState = newState.setIn(['tickets', 'page'], page);
      return setLoading(newState, ['tickets'], false);
    },
        
    fetchTicketsFailure: (state: AppState, action: PayloadAction<string>) => {
      return setError(setLoading(state, ['tickets'], false), ['tickets'], action.payload);
    },
    
    // Ticket detail actions
    fetchTicketDetailStart: (state: AppState) => {
      return setError(setLoading(state, ['ticketDetail'], true), ['ticketDetail'], null);
    },
        
    fetchTicketDetailSuccess: (state: AppState, action: PayloadAction<ImmutableTicket>) => {
      return setLoading(setData(state, ['ticketDetail'], action.payload), ['ticketDetail'], false);
    },
        
    fetchTicketDetailFailure: (state: AppState, action: PayloadAction<string>) => {
      return setError(setLoading(state, ['ticketDetail'], false), ['ticketDetail'], action.payload);
    },
    
    // Comment actions
    addCommentStart: (state: AppState) => {
      return state
        .setIn(['ticketDetail', 'commentLoading'], true)
        .setIn(['ticketDetail', 'commentError'], null);
    },
        
    addCommentSuccess: (state: AppState, action: PayloadAction<{ticketId: string, comment: any}>) => {
      const currentTicket = state.getIn(['ticketDetail', 'data']);
      if (!currentTicket) return state;
      
      // Asegurarse de que currentTicket es un Map de Immutable.js
      const ticketMap = Map.isMap(currentTicket) ? currentTicket : Map(currentTicket);
      
      // Obtener los comentarios actuales o crear una lista vacía si no existen
      const currentComments = ticketMap.get('comments', List()) as List<any>;
      
      // Añadir el nuevo comentario a la lista
      const updatedComments = currentComments.push(action.payload.comment);
      
      return state
        .setIn(['ticketDetail', 'data', 'comments'], updatedComments)
        .setIn(['ticketDetail', 'commentLoading'], false);
    },
    
    addCommentFailure: (state: AppState, action: PayloadAction<string>) => {
      return state
        .setIn(['ticketDetail', 'commentLoading'], false)
        .setIn(['ticketDetail', 'commentError'], action.payload);
    },
    
    // Categories actions
    fetchCategoriesStart: (state: AppState) => {
      return setError(setLoading(state, ['categories'], true), ['categories'], null);
    },
        
    fetchCategoriesSuccess: (state: AppState, action: PayloadAction<List<ImmutableCategory>>) => {
      return setLoading(setData(state, ['categories'], action.payload), ['categories'], false);
    },
        
    fetchCategoriesFailure: (state: AppState, action: PayloadAction<string>) => {
      return setError(setLoading(state, ['categories'], false), ['categories'], action.payload);
    },
  }
});

export const {
  // Dashboard
  fetchDashboardStatsStart,
  fetchDashboardStatsSuccess,
  fetchDashboardStatsFailure,
  
  // Tickets
  setTicketsFilters,
  fetchTicketsStart,
  fetchTicketsSuccess,
  fetchTicketsFailure,
  
  // Ticket Detail
  fetchTicketDetailStart,
  fetchTicketDetailSuccess,
  fetchTicketDetailFailure,
  
  // Comments
  addCommentStart,
  addCommentSuccess,
  addCommentFailure,
  
  // Categories
  fetchCategoriesStart,
  fetchCategoriesSuccess,
  fetchCategoriesFailure
} = appSlice.actions;

export default appSlice.reducer;
