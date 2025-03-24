import { createAsyncThunk } from '@reduxjs/toolkit';
import { Map } from 'immutable';
import { 
  authenticateStart,
  authenticateSuccess,
  authenticateFailure,
  recordAuthEvent
} from '../reducers/userReducer';
import { ImmutableUser } from '../../core/models/zoho.types';
import { promiseToResult } from '../../core/utils/functional';
import { AppDispatch } from '../index';

// Interfaz para la respuesta de autenticación
interface AuthResponse {
  user: ImmutableUser;
  token: string;
}

// Thunk para autenticar usuario de manera funcional
export const authenticateUser = 
  (authenticateUserFn: (email: string, password: string) => Promise<AuthResponse>) => 
  (email: string, password: string) => 
  async (dispatch: AppDispatch): Promise<void> => {
    dispatch(authenticateStart());
    
    const result = await promiseToResult(authenticateUserFn(email, password));
    
    if (result.type === 'success') {
      dispatch(authenticateSuccess(result.value));
      
      // Registrar evento de autenticación para Event Sourcing
      dispatch(recordAuthEvent(Map({
        type: 'USER_AUTHENTICATED',
        timestamp: new Date().toISOString(),
        userId: result.value.user.get('id'),
        metadata: Map({
          email
        })
      })));
      
      return;
    }
    
    dispatch(authenticateFailure(result.error.message));
    
    // Registrar evento de fallo de autenticación
    dispatch(recordAuthEvent(Map({
      type: 'AUTHENTICATION_FAILED',
      timestamp: new Date().toISOString(),
      metadata: Map({
        email,
        error: result.error.message
      })
    })));
  };
