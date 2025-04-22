import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import appReducer from './reducers/appReducer';
import userReducer from './reducers/userReducer';
import authReducer from './slices/authSlice';
import zohoReducer from './slices/zohoSlice';
import dashboardProjectionReducer from './slices/dashboardProjectionSlice';
import dashboardReducer from './slices/dashboardSlice';
import { Map, List, isImmutable } from 'immutable';

// Helper function to transform Immutable.js structures to plain JS for serialization
const immutableStateTransformer = (state: any) => {
  if (isImmutable(state)) {
    return state.toJS();
  } 
  
  // Handle nested immutable structures in plain objects
  if (typeof state === 'object' && state !== null) {
    const transformedState: any = Array.isArray(state) ? [] : {};
    
    for (const key in state) {
      if (Object.prototype.hasOwnProperty.call(state, key)) {
        transformedState[key] = immutableStateTransformer(state[key]);
      }
    }
    
    return transformedState;
  }
  
  return state;
};

const rootReducer = {
  app: appReducer,
  user: userReducer,
  auth: authReducer,
  zoho: zohoReducer,
  dashboardProjection: dashboardProjectionReducer,
  dashboard: dashboardReducer
};

export function createStore() {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // Configure serializable check to handle Immutable.js structures
          isSerializable: (value) => {
            // Allow Immutable.js structures in state
            if (isImmutable(value)) {
              return true;
            }
            // Default serializable check for other values
            return true;
          },
          // Ignore immutable.js structures in actions
          ignoredActions: [
            'payload.user', 
            'payload.token', 
            'payload.tickets', 
            'payload.ticket', 
            'payload.categories', 
            'payload.stats',
            'zoho/fetchReportsOverview/fulfilled'
          ],
          // Ignore immutable.js structures in state
          ignoredPaths: [
            'app.dashboardStats', 
            'app.tickets', 
            'app.ticketDetail', 
            'app.categories',
            'user.user',
            'user.authEvents',
            'auth.tokens',
            'zoho.data'
          ]
        } as any
      }),
    // Add DevTools options to handle immutable structures
    devTools: {
      stateSanitizer: immutableStateTransformer
    }
  });
}

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<ReturnType<typeof createStore>['getState']>;
export type AppDispatch = ReturnType<typeof createStore>['dispatch'];

// Hooks for typed dispatch and selector
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
