/**
 * Root Reducer - Configuración de reducers para Redux
 * 
 * Combina todos los reducers de la aplicación en un root reducer
 * para su uso con configureStore
 */
import { combineReducers } from '@reduxjs/toolkit';
import ticketsReducer from './slices/ticketsSlice';
import createTicketReducer from './slices/createTicketSlice';
import categoriesReducer from './slices/categoriesSlice';
import commentsReducer from './slices/commentsSlice';
import ticketDetailReducer from './slices/ticketDetailSlice';
import authReducer from './slices/authSlice';

// Importamos reducers existentes si hay
// Por ejemplo:
// import dashboardReducer from './slices/dashboardSlice';

const rootReducer = combineReducers({
  tickets: ticketsReducer,
  createTicket: createTicketReducer,
  categories: categoriesReducer,
  comments: commentsReducer,
  ticketDetail: ticketDetailReducer,
  auth: authReducer, // Agregamos el auth reducer
  // Agregar otros reducers que ya existan
  // dashboard: dashboardReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
