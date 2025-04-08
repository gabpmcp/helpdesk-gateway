import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/store';
import { loginSuccess, logout } from '@/store/slices/authSlice';
import { toast } from '@/components/ui/use-toast';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, email, error, isLoading } = useSelector((state: RootState) => state.auth);

  const login = (email: string, password: string) => {
    // Aquí normalmente enviarías una solicitud a tu backend, pero para simulación:
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('user', JSON.stringify({ email, name: 'Usuario Simulado', role: 'client' }));
    
    // Despachar la acción de éxito de login a Redux
    dispatch(loginSuccess({ 
      email, 
      accessToken: 'fake-token', 
      refreshToken: 'fake-refresh-token' 
    }));
    
    toast({
      title: "Inicio de sesión exitoso",
      description: "Bienvenido al Portal de Helpdesk",
    });
  };

  const performLogout = () => {
    // Despachar acción de logout a Redux - esto limpiará localStorage
    dispatch(logout());
    
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
      duration: 3000
    });
    
    console.log('useAuth - Logging out, redirecting to /login');
    
    // Redireccionar de manera forzada después de un breve timeout
    setTimeout(() => {
      navigate('/login', { replace: true });
      window.location.href = '/login'; // Forzar redirección a nivel de navegador si es necesario
    }, 50);
  };

  return {
    isAuthenticated,
    isLoading,
    email,
    error,
    login,
    logout: performLogout
  };
};

export default useAuth;
