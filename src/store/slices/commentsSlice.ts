/**
 * CommentsSlice - FCIS compliant
 * Functional, Composable, Isolated, Stateless
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Map as ImmutableMap, List, fromJS } from 'immutable';
import { RootState } from '../store';
import { getRuntimeConfig } from '../../config/runtimeConfig';

// Base URL para las peticiones API
function getApiBaseUrl() {
  return getRuntimeConfig().api.baseUrl;
}

// Tipos inmutables para el estado de comentarios - definición más específica
type ImmutableComment = ImmutableMap<string, any>;
type ImmutableCommentList = List<ImmutableComment>;

// Interfaz para el comentario
interface CommentInput {
  ticketId: string;
  comment: string;
}

// Estado inicial tipado correctamente
const initialState: ImmutableMap<string, any> = ImmutableMap({
  byTicketId: ImmutableMap(),
  loading: false,
  error: null,
});

/**
 * Thunk para añadir un comentario siguiendo FCIS
 * Sin try/catch, usando promesas para el flujo
 */
export const addComment = createAsyncThunk(
  'comments/add',
  ({ ticketId, comment }: CommentInput) => 
    fetch(`${getApiBaseUrl()}/api/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ comment })
    })
      .then(response => {
        if (!response.ok) {
          return Promise.reject({
            status: response.status,
            message: `Error: ${response.status} ${response.statusText}`
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Comentario añadido:', data);
        // Asegurar que el comentario tenga la estructura correcta
        return {
          ticketId,
          ...data,
          // Si falta timestamp, agregarlo
          timestamp: data.timestamp || new Date().toISOString()
        };
      })
);

/**
 * Slice de comentarios con operaciones inmutables
 * Sigue estrictamente el patrón FCIS
 */
const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(addComment.pending, state => {
        return state.set('loading', true).set('error', null);
      })
      .addCase(addComment.fulfilled, (state, action) => {
        const commentMap = fromJS(action.payload) as ImmutableMap<string, any>;
        const ticketId = commentMap.get('ticketId') as string;
        const clearedState = state.set('loading', false).set('error', null);
        const byTicket = clearedState.get('byTicketId') as ImmutableMap<string, List<ImmutableMap<string, any>>>;
        const updatedByTicket = byTicket.update(ticketId, List<ImmutableMap<string, any>>(), list =>
          list.push(commentMap)
        );
        return clearedState.set('byTicketId', updatedByTicket);
      })
      .addCase(addComment.rejected, (state, action) => {
        return state
          .set('loading', false)
          .set('error', action.error.message || 'Error al añadir comentario');
      });
  }
});

// Selectores siguiendo el patrón funcional
export const selectCommentsByTicketId = (state: RootState, ticketId: string) => {
  // Verificar que el estado de comentarios existe
  const commentsState = state.comments;
  if (!commentsState || !ImmutableMap.isMap(commentsState)) {
    console.warn('El estado de comentarios no es un Map de Immutable.js');
    return List();
  }
  // Asegurar que byTicketId existe y obtener los comentarios del ticket
  const byTicketId = commentsState.get('byTicketId');
  if (!byTicketId || !ImmutableMap.isMap(byTicketId)) {
    return List();
  }
  return byTicketId.get(ticketId, List());
};

export const selectCommentsLoading = (state: RootState) => {
  const commentsState = state.comments;
  return commentsState && ImmutableMap.isMap(commentsState) ? commentsState.get('loading', false) : false;
};

export const selectCommentsError = (state: RootState) => {
  const commentsState = state.comments;
  return commentsState && ImmutableMap.isMap(commentsState) ? commentsState.get('error', null) : null;
};

export default commentsSlice.reducer;
