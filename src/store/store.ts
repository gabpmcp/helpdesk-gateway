/**
 * Redux Store Configuration
 * 
 * Configura el store central de Redux para la aplicación
 * integrando middlewares, devTools y el rootReducer
 */
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Immutable.js structures are not serializable by default
        // but we need to use them for our state
        ignoredActions: [
          'tickets/fetchTickets/fulfilled',
          'tickets/fetchTicketById/fulfilled',
          'tickets/createTicket/fulfilled',
          'tickets/updateTicketStatus/fulfilled',
          'tickets/addTicketComment/fulfilled'
        ],
        ignoredPaths: ['tickets.tickets', 'tickets.selectedTicket'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type AppDispatch = typeof store.dispatch;

// Hooks tipados para usar con React-Redux
export const useAppDispatch = () => store.dispatch;
