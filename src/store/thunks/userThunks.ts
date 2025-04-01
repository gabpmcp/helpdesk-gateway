import { createAsyncThunk } from '@reduxjs/toolkit';
import { Map } from 'immutable';
import { 
  authenticateStart,
  authenticateSuccess,
  authenticateFailure,
  recordAuthEvent
} from '../reducers/userReducer';
import { ImmutableUser } from '../../core/models/zoho.types';
import { promiseToResult, chain, map } from '../../core/utils/functional';
import { AppDispatch } from '../index';
import { authService, AuthCredentials, commandService } from '../../core/api/helpdeskService';

// Interfaz para la respuesta de autenticación
interface AuthResponse {
  user: ImmutableUser;
  token: string;
}

// Thunk para autenticar usuario de manera funcional
export const authenticateUser = 
  (email: string, password: string) => 
  async (dispatch: AppDispatch): Promise<void> => {
    dispatch(authenticateStart());
    
    // Usar el endpoint de comandos para autenticación
    const result = await authService.login({ email, password });
    
    if (result.type === 'success') {
      // Transformar la respuesta del backend al formato esperado por el reducer
      const authData = {
        user: result.value.user,
        token: result.value.role // Using role as token for demo purposes
      };
      
      dispatch(authenticateSuccess(authData));
      
      // No es necesario registrar el evento de autenticación aquí
      // ya que el backend lo hace automáticamente al procesar el comando
      return;
    }
    
    dispatch(authenticateFailure(result.error.message));
  };

// Thunk para cargar el estado del usuario desde el backend
export const loadUserState = 
  (userId: string, token: string) => 
  async (dispatch: AppDispatch): Promise<void> => {
    // Obtener el estado del usuario desde el endpoint de estado
    const result = await commandService.getUserState(userId, token);
    
    if (result.type === 'success') {
      // Actualizar el estado de Redux con los datos del backend
      // Esto dependerá de la estructura de tus reducers
      // Por ejemplo, podrías tener acciones como:
      // dispatch(setUserTickets(result.value.tickets));
      // dispatch(setUserDashboard(result.value.dashboard));
      return;
    }
    
    // Manejar error si es necesario
    console.error('Error loading user state:', result.error);
  };
