import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '@/store/slices/authSlice';
import { createClient } from '@supabase/supabase-js';
import { getRuntimeConfig } from '@/config/runtimeConfig';
import { Loader2 } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Obtener configuración de Supabase
        const config = getRuntimeConfig();
        const supabase = createClient(
          config.supabase?.url || import.meta.env.VITE_SUPABASE_URL,
          config.supabase?.key || import.meta.env.VITE_SUPABASE_KEY
        );

        // Procesar el callback de autenticación
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error en callback de autenticación:', error);
          setError(error.message);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        if (!data.session) {
          console.error('No se recibió sesión en el callback');
          setError('No se pudo establecer la sesión. Por favor intente nuevamente.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // Generar los tokens para la aplicación
        const { user } = data.session;

        if (!user || !user.email) {
          setError('Información de usuario incompleta');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // Verificar que el proveedor sea Google
        const provider = user.app_metadata.provider;
        if (provider !== 'google') {
          setError('Solo se permite autenticación con Google');
          await supabase.auth.signOut();
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // Ahora necesitamos validar contra Zoho CRM
        // Esto asegura que solo usuarios que son contactos en Zoho pueden iniciar sesión
        const validateResponse = await fetch(`${config.api.baseUrl}/api/zoho/validate-contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
          credentials: 'include'
        });

        if (!validateResponse.ok) {
          const errorData = await validateResponse.json();
          setError(errorData.message || 'El email no está registrado como contacto en nuestro sistema');
          
          // Cerrar sesión en Supabase ya que no es un contacto válido
          await supabase.auth.signOut();
          
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // Si la validación es exitosa, obtenemos los tokens de acceso
        const authResponse = await fetch(`${config.api.baseUrl}/api/auth/social-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: user.email,
            supabaseId: user.id,
            provider: 'google' // Siempre será Google en esta implementación
          }),
          credentials: 'include'
        });

        if (!authResponse.ok) {
          const errorData = await authResponse.json();
          setError(errorData.message || 'Error generando tokens de acceso');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const authData = await authResponse.json();

        // Actualizar el estado de autenticación en Redux
        dispatch(loginSuccess({
          email: user.email,
          accessToken: authData.accessToken,
          refreshToken: authData.refreshToken
        }));

        // Guardar en localStorage para asegurar persistencia
        localStorage.setItem('isLoggedIn', 'true');

        // Redirigir al dashboard
        navigate('/', { replace: true });
      } catch (error) {
        console.error('Error procesando autenticación social:', error);
        setError('Error inesperado procesando autenticación');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleAuthCallback();
  }, [dispatch, navigate]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-muted/30">
      <div className="w-full max-w-md space-y-6 text-center">
        {error ? (
          <>
            <h2 className="text-xl font-bold text-destructive">Error de autenticación</h2>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm">Redirigiendo al inicio de sesión...</p>
          </>
        ) : (
          <>
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
            <h2 className="text-2xl font-bold">Completando inicio de sesión con Google</h2>
            <p className="text-muted-foreground">
              Por favor espere mientras completamos el proceso de autenticación...
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
