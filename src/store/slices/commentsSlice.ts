/**
 * CommentsSlice - FCIS compliant
 * Functional, Composable, Isolated, Stateless
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Map, List, fromJS } from 'immutable';
import { RootState } from '../store';

// Base URL para las peticiones API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Tipos inmutables para el estado de comentarios - definición más específica
type ImmutableComment = Map<string, any>;
type ImmutableCommentList = List<ImmutableComment>;
type ImmutableMap<K, V> = Map<K, V>; // Para ayudar al sistema de tipos

// Interfaz para el comentario
interface CommentInput {
  ticketId: string;
  comment: string;
}

// Initial state: Map inmutable con estructura byTicketId
const initialState = Map({
  byTicketId: Map<string, ImmutableCommentList>(),
  loading: false,
  error: null
});

/**
 * Thunk para añadir un comentario siguiendo FCIS
 * Sin try/catch, usando promesas para el flujo
 */
export const addComment = createAsyncThunk(
  'comments/add',
  ({ ticketId, comment }: CommentInput) => 
    fetch(`${API_BASE_URL}/api/tickets/${ticketId}/comments`, {
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
        // Actualización inmutable
        return state.set('loading', true).set('error', null);
      })
      .addCase(addComment.fulfilled, (state, action) => {
        const comment = fromJS(action.payload);
        const ticketId = comment.get('ticketId');
        
        // Usar tipado más específico para ayudar a TypeScript
        const result = state.set('loading', false).set('error', null);
        
        // Usar la función updateIn para modificar la estructura anidada de forma inmutable
        return result.update('byTicketId', byTicketId => 
          byTicketId.update(ticketId, List(), commentList => 
            commentList.push(comment)
          )
        );
      })
      .addCase(addComment.rejected, (state, action) => {
        // Actualización inmutable para el error
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
  
  if (!commentsState || !Map.isMap(commentsState)) {
    console.warn('El estado de comentarios no es un Map de Immutable.js');
    return List();
  }
  
  // Asegurar que byTicketId existe y obtener los comentarios del ticket
  const byTicketId = commentsState.get('byTicketId');
  if (!byTicketId || !Map.isMap(byTicketId)) {
    return List();
  }
  
  return byTicketId.get(ticketId, List());
};

export const selectCommentsLoading = (state: RootState) => {
  const commentsState = state.comments;
  return commentsState && Map.isMap(commentsState) ? commentsState.get('loading', false) : false;
};

export const selectCommentsError = (state: RootState) => {
  const commentsState = state.comments;
  return commentsState && Map.isMap(commentsState) ? commentsState.get('error', null) : null;
};

export default commentsSlice.reducer;
