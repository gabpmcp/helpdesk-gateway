import React, { useEffect, useState } from 'react';
import { List, Map } from 'immutable';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { 
  fetchTicketById, 
  addTicketComment, 
  fetchTicketComments,
  selectSelectedTicket,
  selectTicketLoading,
  selectTicketError,
  selectTicketComments,
  selectCommentsLoading,
  selectCommentsError,
  clearCommentsError
} from '../../store/slices/ticketsSlice';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '../../components/ui/card';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Separator } from '../../components/ui/separator';
import { AlertCircle, Clock, MessageSquare, User, Send, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { formatDistanceToNow } from 'date-fns';
import { toJS } from '../../core/logic/zohoLogic';
import { ZohoCommentInput } from '../../core/models/zoho.types';

interface TicketDetailsProps {
  ticketId: string;
}

/**
 * Functional component that displays and allows interaction with a single ticket
 * using immutable data structures, Redux and declarative patterns
 */
const TicketDetails: React.FC<TicketDetailsProps> = ({
  ticketId,
}) => {
  // Local state for new comment
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Redux hooks
  const dispatch = useAppDispatch();
  const ticket = useAppSelector(selectSelectedTicket);
  const comments = useAppSelector(state => selectTicketComments(state, ticketId));
  const isLoading = useAppSelector(selectTicketLoading);
  const commentsLoading = useAppSelector(selectCommentsLoading);
  const error = useAppSelector(selectTicketError);
  const commentsError = useAppSelector(selectCommentsError);
  
  // Fetch ticket data and comments
  useEffect(() => {
    if (ticketId) {
      dispatch(fetchTicketById(ticketId));
      dispatch(fetchTicketComments(ticketId));
    }
  }, [dispatch, ticketId]);
  
  // Función pura para extraer datos del ticket (enfoque funcional)
  const getTicketData = () => {
    if (!ticket) return {
      id: '',
      subject: 'Cargando...',
      description: '',
      status: '',
      priority: '',
      createdTime: '',
      dueDate: '',
      createdTimestamp: 0
    };
    
    // Extraer datos del Map inmutable de forma segura
    // Función pura para formatear fechas
    const formatDateSafe = (dateStr: any): string => {
      if (!dateStr) return 'No disponible';
      
      try {
        // Intentar convertir a fecha válida
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          console.log('Fecha inválida recibida:', dateStr);
          return 'Fecha no disponible';
        }
        
        // Formato español DD/MM/YYYY HH:MM
        return new Intl.DateTimeFormat('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(date);
      } catch (error) {
        console.error('Error al formatear fecha:', error);
        return 'Fecha no disponible';
      }
    };
    
    // Obtener datos con manejo defensivo usando getIn para estructuras anidadas
    const id = ticket.get('id', '');
    const subject = ticket.get('subject', 'Sin asunto');
    const description = ticket.get('description', '');
    const status = ticket.get('status', 'Open');
    const priority = ticket.get('priority', 'Medium');
    const category = ticket.get('departmentId', ticket.get('category', 'General'));
    
    // Intentar obtener fechas con varios patrones posibles
    const createdTimeRaw = 
      ticket.get('createdTime') || 
      ticket.getIn(['cf', 'cf_created_time']) || 
      ticket.get('createdTimestamp') ||
      '';
      
    const modifiedTimeRaw = 
      ticket.get('modifiedTime') || 
      ticket.getIn(['cf', 'cf_modified_time']) || 
      ticket.get('updatedTimestamp') ||
      '';
      
    const dueDateRaw = 
      ticket.get('dueDate') || 
      ticket.getIn(['cf', 'cf_due_date']) ||
      '';
    
    // Formatear fechas con la función defensiva
    const createdTime = formatDateSafe(createdTimeRaw);
    const lastUpdated = formatDateSafe(modifiedTimeRaw);
    const dueDate = dueDateRaw ? formatDateSafe(dueDateRaw) : 'No establecida';
    
    // Crear timestamp para ordenación (usar Date.now() como fallback)
    const createdTimestamp = typeof createdTimeRaw === 'string' && createdTimeRaw 
      ? new Date(createdTimeRaw).getTime() 
      : Date.now();
    
    return {
      id,
      subject,
      description,
      status,
      priority,
      category,
      createdTime,
      lastUpdated,
      dueDate,
      createdTimestamp
    };
  };
  
  // Patrón funcional para obtener datos del ticket
  const ticketData = getTicketData();
  
  // Función pura para manejar el envío de comentarios
  const handleSubmitComment = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!comment.trim()) return;
    
    // Crear comentario con estructura inmutable
    const commentData: ZohoCommentInput = {
      comment: comment.trim(),
      isPublic: true
    };
    
    setSubmitting(true);
    
    // Patrón de composición funcional con promesas encadenadas
    dispatch(addTicketComment({ ticketId, comment: commentData }))
      .then(() => {
        // Limpiar el campo de comentario solo si la acción fue exitosa
        setComment('');
      })
      .finally(() => {
        setSubmitting(false);
      });
  };
  
  // Función pura para limpiar errores
  const clearErrors = () => {
    dispatch(clearCommentsError());
  };
  
  // Obtener el color según la prioridad
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-500/10 text-red-600';
      case 'medium': return 'bg-amber-500/10 text-amber-600';
      case 'low': return 'bg-green-500/10 text-green-600';
      default: return 'bg-slate-500/10 text-slate-600';
    }
  };
  
  // Obtener el color según el estado
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-green-500/10 text-green-600';
      case 'in progress': return 'bg-blue-500/10 text-blue-600';
      case 'on hold': return 'bg-amber-500/10 text-amber-600';
      case 'closed': return 'bg-slate-500/10 text-slate-600';
      default: return 'bg-slate-500/10 text-slate-600';
    }
  };

  // Si está cargando, mostrar un indicador
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Cargando detalles del ticket...</p>
      </div>
    );
  }

  // Si hay un error, mostrar mensaje de error
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-1.5">
            <CardTitle className="text-xl">{ticketData.subject}</CardTitle>
            <CardDescription>
              <span className="text-xs text-muted-foreground">Ticket #{ticketData.id}</span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Descripción</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {ticketData.description}
            </p>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <h3 className="text-xs font-medium text-muted-foreground">Estado</h3>
              <Badge variant="outline" className={`${getStatusColor(ticketData.status)}`}>
                {ticketData.status}
              </Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-medium text-muted-foreground">Prioridad</h3>
              <Badge variant="outline" className={`${getPriorityColor(ticketData.priority)}`}>
                {ticketData.priority}
              </Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-medium text-muted-foreground">Creado</h3>
              <p className="text-sm flex items-center">
                <Clock className="h-3 w-3 mr-1 inline-block" />
                {ticketData.createdTimestamp ? 
                  formatDistanceToNow(new Date(ticketData.createdTimestamp), { addSuffix: true }) : 
                  'Desconocido'}
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-medium text-muted-foreground">Vencimiento</h3>
              <p className="text-sm">
                {ticketData.dueDate ? 
                  new Date(ticketData.dueDate).toLocaleDateString() : 
                  'No definido'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Sección de comentarios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Comentarios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {commentsError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{commentsError}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto p-2">
            {commentsLoading && !comments.size ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Cargando comentarios...</span>
              </div>
            ) : comments.size === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay comentarios. ¡Sé el primero en comentar!
              </div>
            ) : (
              // Renderizar comentarios usando transformación funcional
              comments
                .sortBy(comment => -(comment.get('createdTimestamp', 0) as number))
                .map(commentItem => {
                  const commentJS = toJS(commentItem);
                  const author = commentJS.author || commentJS.createdBy || 'Anónimo';
                  const content = commentJS.content || commentJS.comment || '';
                  const createdTime = commentJS.createdTime || new Date().toISOString();
                  const createdTimestamp = commentJS.createdTimestamp || new Date(createdTime).getTime();
                  
                  // Obtener iniciales para el avatar
                  const initials = author
                    .split(' ')
                    .map(name => name[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();
                  
                  return (
                    <div key={commentJS.id || createdTimestamp} className="flex gap-3 mb-4">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium">{author}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(createdTimestamp), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="text-sm">{content}</div>
                      </div>
                    </div>
                  );
                }).toArray()
            )}
          </div>
          
          <form onSubmit={handleSubmitComment} className="space-y-3 mt-4">
            <Textarea
              placeholder="Añade tu comentario..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              disabled={submitting}
              className="min-h-24 resize-none"
            />
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={submitting || !comment.trim()}
                className="flex items-center"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar
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

export default TicketDetails;
