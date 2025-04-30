import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock, AlertCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { registerAttempt } from '@/store/slices/authSlice';

export const RegisterForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  
  // Obtenemos el estado de error del store para detectar errores específicos
  const authError = useAppSelector(state => state.auth.error);

  const validateForm = (): boolean => {
    if (!email || !password || !confirmPassword) {
      setValidationError('Todos los campos son obligatorios');
      return false;
    }

    if (password !== confirmPassword) {
      setValidationError('Las contraseñas no coinciden');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Por favor ingresa un correo electrónico válido');
      return false;
    }

    if (password.length < 8) {
      setValidationError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }

    setValidationError(null);
    setErrorDetails(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      setValidationError(null);
      setErrorDetails(null);
      
      // Log para depuración
      console.log(`📝 Intentando registrar usuario: ${email}`);
      
      // Usar Redux thunk para llamar al endpoint de registro que validará contra Zoho CRM
      const resultAction = await dispatch(registerAttempt({ email, password }));
      
      console.log('📊 Resultado de registro:', resultAction);
      
      if (registerAttempt.fulfilled.match(resultAction)) {
        console.log('✅ Registro exitoso');
        toast({
          title: "¡Registro exitoso!",
          description: "Tu cuenta ha sido creada. Ahora puedes iniciar sesión.",
          variant: "default",
        });
        navigate('/login');
      } else if (registerAttempt.rejected.match(resultAction)) {
        console.error('❌ Registro rechazado:', resultAction.payload || resultAction.error);
        
        const errorMessage = resultAction.payload?.message || resultAction.error.message;
        
        // Verificar si el error está relacionado con Zoho CRM
        if (errorMessage?.includes('Zoho CRM') || errorMessage?.includes('not registered')) {
          setValidationError('El correo electrónico no está registrado como contacto en nuestro sistema');
          setErrorDetails('Para registrarte, tu correo debe pertenecer a un contacto existente en nuestra base de datos de clientes.');
        } else {
          setValidationError(errorMessage || 'Error en el registro. Intenta nuevamente más tarde.');
        }
      }
    } catch (error) {
      console.error('❌ Error general de registro:', error);
      setValidationError('Ocurrió un error inesperado. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Registro</CardTitle>
        <CardDescription className="text-center">
          Crea una cuenta para acceder al portal de soporte
        </CardDescription>
      </CardHeader>
      <CardContent>
        {validationError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-medium">Error de validación</AlertTitle>
            <AlertDescription>{validationError}</AlertDescription>
            {errorDetails && (
              <div className="mt-2 text-xs flex items-center gap-2">
                <Info className="h-3 w-3" />
                <span>{errorDetails}</span>
              </div>
            )}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="email" 
                type="email" 
                placeholder="nombre@ejemplo.com" 
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              El correo electrónico debe coincidir con un contacto existente en nuestro sistema CRM
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="confirmPassword" 
                type="password" 
                placeholder="••••••••"
                className="pl-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              'Registrarse'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2">
        <div className="text-center text-sm text-muted-foreground">
          ¿Ya tienes una cuenta?{' '}
          <Button variant="link" className="h-auto p-0" onClick={() => navigate('/login')}>
            Iniciar sesión
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default RegisterForm;
