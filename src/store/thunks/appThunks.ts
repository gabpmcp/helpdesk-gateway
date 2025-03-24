import { createAsyncThunk } from '@reduxjs/toolkit';
import { Map, List, fromJS } from 'immutable';
import { 
  fetchDashboardStatsStart,
  fetchDashboardStatsSuccess,
  fetchDashboardStatsFailure,
  fetchTicketsStart,
  fetchTicketsSuccess,
  fetchTicketsFailure,
  fetchTicketDetailStart,
  fetchTicketDetailSuccess,
  fetchTicketDetailFailure,
  addCommentStart,
  addCommentSuccess,
  addCommentFailure,
  fetchCategoriesStart,
  fetchCategoriesSuccess,
  fetchCategoriesFailure
} from '../reducers/appReducer';
import { 
  ImmutableTicket, 
  ImmutableDashboardStats, 
  ImmutableCategory,
  ZohoFilters
} from '../../core/models/zoho.types';
import { promiseToResult, normalizeError } from '../../core/utils/functional';
import { AppDispatch } from '../index';

// Thunk para obtener estadísticas del dashboard de manera funcional
export const fetchDashboardStats = 
  (getDashboardStats: () => Promise<ImmutableDashboardStats>) => 
  async (dispatch: AppDispatch): Promise<void> => {
    dispatch(fetchDashboardStatsStart());
    
    const result = await promiseToResult(getDashboardStats());
    
    return result.type === 'success'
      ? dispatch(fetchDashboardStatsSuccess(result.value))
      : dispatch(fetchDashboardStatsFailure(result.error.message));
  };

// Thunk para obtener tickets de manera funcional
export const fetchTickets = 
  (getTickets: (filters: ZohoFilters) => Promise<{tickets: List<ImmutableTicket>, total: number, page: number}>) => 
  (filters: ZohoFilters) => 
  async (dispatch: AppDispatch): Promise<void> => {
    dispatch(fetchTicketsStart());
    
    const result = await promiseToResult(getTickets(filters));
    
    return result.type === 'success'
      ? dispatch(fetchTicketsSuccess(result.value))
      : dispatch(fetchTicketsFailure(result.error.message));
  };

// Thunk para obtener detalle de ticket de manera funcional
export const fetchTicketDetail = 
  (getTicketById: (id: string) => Promise<ImmutableTicket>) => 
  (id: string) => 
  async (dispatch: AppDispatch): Promise<void> => {
    dispatch(fetchTicketDetailStart());
    
    const result = await promiseToResult(getTicketById(id));
    
    return result.type === 'success'
      ? dispatch(fetchTicketDetailSuccess(result.value))
      : dispatch(fetchTicketDetailFailure(result.error.message));
  };

// Thunk para añadir comentario de manera funcional
export const addComment = 
  (addCommentFn: (ticketId: string, commentData: any) => Promise<any>) => 
  (ticketId: string, commentData: any) => 
  async (dispatch: AppDispatch): Promise<void> => {
    dispatch(addCommentStart());
    
    const result = await promiseToResult(addCommentFn(ticketId, commentData));
    
    return result.type === 'success'
      ? dispatch(addCommentSuccess({ ticketId, comment: result.value }))
      : dispatch(addCommentFailure(result.error.message));
  };

// Thunk para crear ticket de manera funcional
export const createTicket = 
  (createTicketFn: (ticketData: any) => Promise<ImmutableTicket>) => 
  (ticketData: any) => 
  async (dispatch: AppDispatch): Promise<ImmutableTicket | null> => {
    const result = await promiseToResult(createTicketFn(ticketData));
    
    if (result.type === 'success') {
      // Actualizar la lista de tickets después de crear uno nuevo
      return result.value;
    }
    
    return null;
  };

// Thunk para obtener categorías de manera funcional
export const fetchCategories = 
  (getCategories: () => Promise<List<ImmutableCategory>>) => 
  async (dispatch: AppDispatch): Promise<void> => {
    dispatch(fetchCategoriesStart());
    
    const result = await promiseToResult(getCategories());
    
    return result.type === 'success'
      ? dispatch(fetchCategoriesSuccess(result.value))
      : dispatch(fetchCategoriesFailure(result.error.message));
  };
