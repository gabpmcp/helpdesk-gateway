/**
 * Root Reducer - Configuración de reducers para Redux
 * 
 * Combina todos los reducers de la aplicación en un root reducer
 * para su uso con configureStore
 */
import { combineReducers } from '@reduxjs/toolkit';
import ticketReducer from './slices/ticketSlice';

// Importamos reducers existentes si hay
// Por ejemplo:
// import dashboardReducer from './slices/dashboardSlice';
// import authReducer from './slices/authSlice';

const rootReducer = combineReducers({
  tickets: ticketReducer,
  // Agregar otros reducers que ya existan
  // dashboard: dashboardReducer,
  // auth: authReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
