import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Map as ImmutableMap } from 'immutable';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const location = useLocation();
  
  // Obtener el estado de autenticación desde Redux
  const auth = useSelector((state: RootState) => state.auth);
  const isAuthenticatedFromRedux = auth?.isAuthenticated || false;
  
  // Verificar también el localStorage para casos donde se recarga la página
  const isAuthenticatedFromStorage = localStorage.getItem('isLoggedIn') === 'true';
  
  // Combinar ambas fuentes: el usuario está autenticado si lo está en Redux O en el localStorage
  const isAuthenticated = isAuthenticatedFromRedux || isAuthenticatedFromStorage;
  
  // Registrar en la consola para debugging
  console.log('AuthGuard - Validación de autenticación:', {
    path: location.pathname,
    reduxState: isAuthenticatedFromRedux,
    localStorageState: isAuthenticatedFromStorage,
    isAuthenticated: isAuthenticated,
    tokens: auth.tokens ? 'present' : 'absent'
  });
  
  // Efecto para forzar la verificación completa de autenticación
  useEffect(() => {
    // Si no está autenticado, limpiar cualquier dato residual
    if (!isAuthenticated) {
      console.log('AuthGuard - Usuario no autenticado, limpiando datos residuales');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user');
      localStorage.removeItem('auth');
    }
  }, [isAuthenticated]);
  
  if (!isAuthenticated) {
    console.log('AuthGuard - Redirigiendo a login desde:', location.pathname);
    
    // Forzar la limpieza de localStorage para evitar estados inconsistentes
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem('auth');
    
    // Redirect to login page, but save the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If user is authenticated, render the children
  return <>{children}</>;
};

export default AuthGuard;
