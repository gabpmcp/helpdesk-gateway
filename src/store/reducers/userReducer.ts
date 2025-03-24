import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Map, List, fromJS } from 'immutable';
import { ImmutableUser } from '../../core/models/zoho.types';

// Definir el tipo para el estado del usuario
export type UserState = Map<string, any>;

// Estado inicial usando estructuras inmutables
const initialState = Map({
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  // Eventos de autenticación para el patrón Event Sourcing
  authEvents: Map({
    events: List(),
    lastEvent: null
  })
});

// Funciones auxiliares para trabajar con el estado inmutable
const setLoading = (state: UserState, loading: boolean): UserState => {
  return state.set('loading', loading);
};

const setError = (state: UserState, error: string | null): UserState => {
  return state.set('error', error);
};

// Slice con reducers puros e inmutables
const userSlice = createSlice({
  name: 'user',
  initialState: initialState as any,
  reducers: {
    // Auth actions
    authenticateStart: (state: UserState) => {
      return setError(setLoading(state, true), null);
    },
           
    authenticateSuccess: (state: UserState, action: PayloadAction<{user: ImmutableUser, token: string}>) => {
      return state
        .set('user', action.payload.user)
        .set('token', action.payload.token)
        .set('loading', false)
        .set('isAuthenticated', true);
    },
           
    authenticateFailure: (state: UserState, action: PayloadAction<string>) => {
      return state
        .set('loading', false)
        .set('error', action.payload)
        .set('isAuthenticated', false);
    },
    
    // Logout action
    logout: (state: UserState) => {
      return state
        .set('user', null)
        .set('token', null)
        .set('isAuthenticated', false);
    },
    
    // Token action
    setToken: (state: UserState, action: PayloadAction<string>) => {
      return state.set('token', action.payload);
    },
    
    // Event Sourcing actions
    recordAuthEvent: (state: UserState, action: PayloadAction<Map<string, any>>) => {
      const currentEvents = state.getIn(['authEvents', 'events']) as List<any>;
      if (!currentEvents) {
        return state
          .setIn(['authEvents', 'events'], List([action.payload]))
          .setIn(['authEvents', 'lastEvent'], action.payload);
      }
      
      return state
        .setIn(['authEvents', 'events'], currentEvents.push(action.payload))
        .setIn(['authEvents', 'lastEvent'], action.payload);
    }
  }
});

export const {
  authenticateStart,
  authenticateSuccess,
  authenticateFailure,
  logout,
  setToken,
  recordAuthEvent
} = userSlice.actions;

export default userSlice.reducer;
