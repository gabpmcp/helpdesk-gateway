import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { useNavigate } from 'react-router-dom';
import { 
  createTicket,
  selectTicketLoading,
  selectTicketError,
  resetCreateTicket
} from '../../store/slices/createTicketSlice';
import { 
  selectCategories,
  selectCategoriesLoading,
  fetchCategories
} from '../../store/slices/categoriesSlice';
import { zohoService } from '../../services/zohoService';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '../../components/ui/card';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '../../components/ui/form';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { AlertCircle, Loader2, SendHorizonal } from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { useToast } from '../../hooks/use-toast';
import { ZohoTicketInput } from '../../core/models/zoho.types';

/**
 * Componente para crear un nuevo ticket en el sistema
 * Con soporte para campos básicos y archivos adjuntos
 */
const CreateTicket: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectTicketLoading);
  const error = useAppSelector(selectTicketError);
  const categories = useAppSelector(selectCategories);
  const { toast } = useToast();
  
  // Estado del formulario
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Cargar categorías al montar el componente
  useEffect(() => {
    dispatch(fetchCategories(zohoService.getCategories));
  }, [dispatch]);

  // Función pura para validar el formulario
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!subject.trim()) {
      errors.subject = 'El asunto es requerido';
    }
    
    if (!description.trim()) {
      errors.description = 'La descripción es requerida';
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos
    const validation = validateForm();
    if (!validation.valid) {
      // Mostrar errores de validación
      Object.entries(validation.errors).forEach(([field, message]) => {
        toast({
          title: `Error en ${field}`,
          description: message,
          variant: 'destructive',
        });
      });
      return;
    }
    
    setSubmitting(true);
    
    // Crear datos del ticket (enfoque funcional)
    const ticketData: ZohoTicketInput = {
      subject: subject.trim(),
      description: description.trim(),
      priority,
      departmentId: category || undefined
    };
    
    try {
      // Usar thunk con promesa para manejo funcional
      const resultAction = await dispatch(createTicket({ 
        createTicketFn: zohoService.createTicket, 
        ticketData 
      }));
      
      if (createTicket.fulfilled.match(resultAction)) {
        // Éxito - mostrar toast y redirigir
        toast({
          title: 'Ticket creado correctamente',
          description: 'Serás redirigido a la página de tickets.',
        });
        
        // Esperar un momento antes de redirigir para que el usuario vea el mensaje
        setTimeout(() => {
          navigate('/tickets');
        }, 1500);
      } else if (createTicket.rejected.match(resultAction)) {
        // Error - mostrar toast
        toast({
          title: 'Error al crear el ticket',
          description: resultAction.payload || 'Ocurrió un error inesperado',
          variant: 'destructive',
        });
      }
    } catch (err) {
      // Error no manejado
      console.error('Error al crear ticket:', err);
      toast({
        title: 'Error al crear el ticket',
        description: 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Crear Nuevo Ticket</CardTitle>
          <CardDescription>
            Completa el formulario para crear un nuevo ticket de soporte
          </CardDescription>
        </CardHeader>
        
        {error && (
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        )}
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <FormLabel htmlFor="subject">Asunto</FormLabel>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Resumen breve de tu solicitud"
                  disabled={submitting}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <FormLabel htmlFor="category">Categoría</FormLabel>
                <Select
                  value={category}
                  onValueChange={setCategory}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">General</SelectItem>
                    {categories.map((cat: any) => (
                      <SelectItem 
                        key={cat.get('id', '')} 
                        value={cat.get('id', '')}
                      >
                        {cat.get('name', '')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <FormLabel htmlFor="priority">Prioridad</FormLabel>
                <Select
                  value={priority}
                  onValueChange={setPriority}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Baja</SelectItem>
                    <SelectItem value="Medium">Media</SelectItem>
                    <SelectItem value="High">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <FormLabel htmlFor="description">Descripción</FormLabel>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe tu problema o solicitud en detalle"
                  disabled={submitting}
                  className="min-h-32"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/tickets')}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="flex items-center"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <SendHorizonal className="mr-2 h-4 w-4" />
                    Crear Ticket
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateTicket;
