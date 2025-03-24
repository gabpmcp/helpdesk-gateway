import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import appReducer from './reducers/appReducer';
import userReducer from './reducers/userReducer';

export const store = configureStore({
  reducer: {
    app: appReducer,
    user: userReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore immutable.js structures in actions
        ignoredActions: ['payload.user', 'payload.token', 'payload.tickets', 'payload.ticket', 'payload.categories', 'payload.stats'],
        // Ignore immutable.js structures in state
        ignoredPaths: [
          'app.dashboardStats', 
          'app.tickets', 
          'app.ticketDetail', 
          'app.categories',
          'user.user',
          'user.authEvents'
        ]
      }
    })
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Hooks for typed dispatch and selector
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
