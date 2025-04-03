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

// Importamos reducers existentes si hay
// Por ejemplo:
// import dashboardReducer from './slices/dashboardSlice';
// import authReducer from './slices/authSlice';

const rootReducer = combineReducers({
  tickets: ticketsReducer,
  createTicket: createTicketReducer,
  categories: categoriesReducer,
  comments: commentsReducer,
  ticketDetail: ticketDetailReducer,
  // Agregar otros reducers que ya existan
  // dashboard: dashboardReducer,
  // auth: authReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
