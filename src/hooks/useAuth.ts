import { useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useDispatch, useSelector } from 'react-redux';
import { loginAttempt, logout, socialLoginAttempt } from '../store/slices/authSlice';
import type { AppDispatch, RootState } from '../store/store';
import { getRuntimeConfig } from '@/config/runtimeConfig';

// Definiciones de tipos para autenticación
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface LoginResponse {
  success: boolean;
  email: string;
  accessToken: string;
  refreshToken: string;
  error?: string;
}

// Esta función es separada para evitar el error de tipado
// al importar la acción del slice directamente
const refreshTokenFromBackend = async (email: string, refreshToken: string, dispatch: AppDispatch) => {
  try {
    const { createRefreshTokenCommand, dispatchCommand } = await import('../core/api/commandDispatcher');
    const refreshCommand = createRefreshTokenCommand(email, refreshToken);
    const result = await dispatchCommand<LoginResponse>(refreshCommand);
    
    if (result.type === 'success') {
      const response = result.value;
      
      if (!response.success) {
        throw new Error(response.error || 'Token refresh failed');
      }
      
      return response;
    } else {
      throw new Error(result.error.message || 'Token refresh failed');
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error('Token refresh failed');
  }
};

// Hook personalizado para autenticación
export const useAuth = () => {
  const config = getRuntimeConfig();
  const dispatch = useDispatch<AppDispatch>();
  const { email, tokens } = useSelector((state: RootState) => state.auth);
  
  // Inicializar cliente de Supabase con configuración en tiempo de ejecución
  const supabase = createClient(
    config.supabase?.url || import.meta.env.VITE_SUPABASE_URL,
    config.supabase?.key || import.meta.env.VITE_SUPABASE_KEY
  );
  
  // Login tradicional (email/password)
  const login = useCallback(async (email: string, password: string) => {
    const resultAction = await dispatch(loginAttempt({ email, password }));
    
    if (loginAttempt.rejected.match(resultAction)) {
      throw new Error(resultAction.payload as string);
    }
    
    return resultAction.payload;
  }, [dispatch]);
  
  // Refresh token
  const refreshTokenFn = useCallback(async () => {
    try {
      if (!email || !tokens || !tokens.refreshToken) {
        throw new Error('No refresh token available');
      }
      
      // Usar la función auxiliar para evitar problemas de tipado
      return await refreshTokenFromBackend(email, tokens.refreshToken, dispatch);
    } catch (error) {
      throw error;
    }
  }, [dispatch, email, tokens]);
  
  // Cerrar sesión
  const logoutFn = useCallback(() => {
    // Cerrar sesión en Supabase
    supabase.auth.signOut().catch(error => {
      console.error('Error al cerrar sesión en Supabase:', error);
    });
    
    // Dispatch de la acción de logout en Redux
    dispatch(logout());
  }, [dispatch, supabase.auth]);
  
  // Login con Google (solo Google, eliminado GitHub)
  const loginWithSocial = useCallback(async (provider: 'google') => {
    // Marcar estado de carga en Redux
    dispatch(socialLoginAttempt({ provider }));
    
    // Configurar autenticación con Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) {
      throw new Error(`Error al iniciar sesión con ${provider}: ${error.message}`);
    }
    
    return data;
  }, [dispatch, supabase.auth]);
  
  return {
    login,
    logout: logoutFn,
    refreshToken: refreshTokenFn,
    loginWithSocial
  };
};
